import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Banknote, Calendar, Clock, MapPin, Zap } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { useSession } from '@/hooks/useSession';
import { useApi } from '@/hooks/useApi';
import { useChartColors } from '@/hooks/useChartColors';
import { fmtNum, minusDaysIso, startOfMonthIso, toApiDate, todayIso } from '@/lib/dates';
import { estimateBill } from '@/lib/pricing';
import type { DayResp } from '@/lib/types';

export function OverviewPage() {
  const { currentMakh, currentCustomer } = useSession();
  const colors = useChartColors();

  // Last 30 days for sparkline + averages
  const range30 = currentMakh
    ? {
        input_makh: currentMakh,
        input_tungay: toApiDate(minusDaysIso(29)),
        input_denngay: toApiDate(todayIso()),
      }
    : null;
  const last30 = useApi<DayResp>(currentMakh ? '/api/dien/ngay' : null, range30, [currentMakh]);

  // Current month so far
  const thisMonth = currentMakh
    ? {
        input_makh: currentMakh,
        input_tungay: toApiDate(startOfMonthIso(0)),
        input_denngay: toApiDate(todayIso()),
      }
    : null;
  const month = useApi<DayResp>(currentMakh ? '/api/dien/ngay' : null, thisMonth, [currentMakh]);

  const rows30 = last30.data?.data?.sanluong_tungngay || [];
  const rowsMonth = month.data?.data?.sanluong_tungngay || [];

  const stats = useMemo(() => {
    const total30 = rows30.reduce((s, r) => s + Number(r.Tong || 0), 0);
    const avg30 = rows30.length ? total30 / rows30.length : 0;
    const yesterday = rows30[rows30.length - 1];
    const totalMonth = rowsMonth.reduce((s, r) => s + Number(r.Tong || 0), 0);
    const days = Math.max(1, rowsMonth.length);

    // Estimate full-month projection
    const projectedKWh = avg30 * 30;
    const monthBill = estimateBill(totalMonth, days);
    const projectedBill = estimateBill(projectedKWh, 30);

    // delta = current 15 days vs prior 15 days
    const half = Math.floor(rows30.length / 2);
    const recent = rows30.slice(half).reduce((s, r) => s + Number(r.Tong || 0), 0);
    const prior = rows30.slice(0, half).reduce((s, r) => s + Number(r.Tong || 0), 0);
    const delta = prior > 0 ? ((recent - prior) / prior) * 100 : null;

    return { total30, avg30, yesterday, totalMonth, days, monthBill, projectedBill, delta };
  }, [rows30, rowsMonth]);

  const sparkData = rows30.map((r) => ({ ngay: r.ngay, kWh: Number(r.Tong || 0) }));
  const loading = last30.loading || month.loading;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tổng quan</h1>
          <p className="mt-1 text-sm text-muted">
            Số liệu tổng hợp 30 ngày gần nhất và ước tính hóa đơn tháng hiện tại.
          </p>
        </div>
        {currentCustomer && (
          <Card className="px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-medium text-fg">{currentCustomer.TEN_KHANG}</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">{currentCustomer.DIA_CHI}</div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="30 ngày gần nhất"
          value={fmtNum(stats.total30)}
          unit="kWh"
          hint={`TB ${fmtNum(stats.avg30)} kWh/ngày`}
          icon={<Zap className="h-5 w-5" />}
          delta={stats.delta}
          loading={loading}
        />
        <KpiCard
          label="Hôm qua"
          value={stats.yesterday ? fmtNum(stats.yesterday.Tong) : '—'}
          unit="kWh"
          hint={stats.yesterday?.ngayFull || ''}
          accent="success"
          icon={<Calendar className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Tháng này (đến nay)"
          value={fmtNum(stats.totalMonth)}
          unit="kWh"
          hint={`${stats.days} ngày · ước tính ${fmtMoney(stats.monthBill.total)}`}
          accent="warning"
          icon={<Clock className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Dự kiến cả tháng"
          value={stats.projectedBill.total.toLocaleString('vi-VN')}
          unit="₫"
          hint={`≈ ${fmtNum(stats.projectedBill.kWh, 0)} kWh, bao gồm VAT`}
          accent="accent"
          icon={<Banknote className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader
          title="Sản lượng 30 ngày gần nhất"
          subtitle="Tổng kWh theo ngày"
          right={
            <Link
              to="/daily"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Xem chi tiết <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <CardBody>
          <div className="h-[260px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : sparkData.length === 0 ? (
              <EmptyState description="Chưa có dữ liệu 30 ngày." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="ngay"
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(1, Math.floor(sparkData.length / 7))}
                  />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v, 0)} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${fmtNum(v)} kWh`} />} />
                  <Area
                    type="monotone"
                    dataKey="kWh"
                    stroke={colors.primary}
                    strokeWidth={2}
                    fill="url(#overviewGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickLink to="/daily" title="Theo ngày" desc="Stacked TD / BT / CD, presets nhanh." />
        <QuickLink to="/hourly" title="Theo giờ" desc="Phụ tải 24h với dải khung giờ." />
        <QuickLink to="/billing" title="Kỳ hóa đơn" desc="Cả năm + tiền điện ước tính." />
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-border bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{title}</span>
        <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </Link>
  );
}

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫';
}
