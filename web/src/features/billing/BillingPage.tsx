import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Banknote, Calendar, Zap } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { useSession } from '@/hooks/useSession';
import { useApi } from '@/hooks/useApi';
import { useChartColors } from '@/hooks/useChartColors';
import { daysBetween, fmtMoney, fmtNum, fromApiDate } from '@/lib/dates';
import { estimateBill } from '@/lib/pricing';
import type { BillingResp, BillingRow } from '@/lib/types';

export function BillingPage() {
  const { currentMakh } = useSession();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const colors = useChartColors();

  const body = currentMakh ? { input_makh: currentMakh, input_nam: String(year) } : null;
  const { data, loading, error, reload } = useApi<BillingResp>(
    currentMakh ? '/api/dien/kyhoadon' : null,
    body,
    [currentMakh, year]
  );

  const rows: BillingRow[] = data?.data?.sanluong_hoadon || [];

  const enriched = useMemo(() => {
    return rows.map((r) => {
      const kWh = Number(r.sanluong || r.SAN_LUONG || r.Tong || 0);
      const days =
        r.tungay && r.denngay ? daysBetween(fromApiDate(r.tungay), fromApiDate(r.denngay)) : 30;
      const bill = estimateBill(kWh, days);
      return {
        ky: r.ky || r.thang || r.kyhoadon || r.tieude || '',
        tungay: r.tungay || '',
        denngay: r.denngay || '',
        days,
        kWh,
        money: bill.total,
      };
    });
  }, [rows]);

  const totals = useMemo(() => {
    const tk = enriched.reduce((s, r) => s + r.kWh, 0);
    const tm = enriched.reduce((s, r) => s + r.money, 0);
    const avg = enriched.length ? tk / enriched.length : 0;
    const max = enriched.reduce<{ ky: string; v: number } | null>(
      (m, r) => (!m || r.kWh > m.v ? { ky: r.ky, v: r.kWh } : m),
      null
    );
    return { tk, tm, avg, max };
  }, [enriched]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Theo kỳ hóa đơn</h1>
        <p className="mt-1 text-sm text-muted">
          Sản lượng từng kỳ ghi điện trong năm và ước tính tiền điện bậc thang sinh hoạt.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Field label="Năm" className="max-w-[10rem]">
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 6 }).map((_, i) => {
                const y = currentYear - i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </Select>
          </Field>
          <Button variant="soft" onClick={() => reload()}>
            Tra cứu lại
          </Button>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Tổng sản lượng năm"
          value={fmtNum(totals.tk)}
          unit="kWh"
          icon={<Zap className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Ước tính tổng tiền"
          value={totals.tm.toLocaleString('vi-VN')}
          unit="₫"
          hint="VAT 8% đã bao gồm"
          accent="accent"
          icon={<Banknote className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Trung bình mỗi kỳ"
          value={fmtNum(totals.avg)}
          unit="kWh"
          accent="primary"
          icon={<Calendar className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Kỳ cao nhất"
          value={totals.max ? fmtNum(totals.max.v) : '—'}
          unit="kWh"
          hint={totals.max?.ky || '—'}
          accent="warning"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader
          title="Biểu đồ kỳ hóa đơn"
          subtitle="Cột = kWh · Đường = ước tính tiền"
        />
        <CardBody>
          <div className="h-[360px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : error ? (
              <EmptyState
                title="Không tải được dữ liệu"
                description={error}
                action={
                  <Button variant="soft" size="sm" onClick={reload}>
                    Thử lại
                  </Button>
                }
              />
            ) : enriched.length === 0 ? (
              <EmptyState description="Năm này chưa có dữ liệu kỳ hóa đơn." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enriched} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ky" tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="kwh"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => fmtNum(v, 0)}
                  />
                  <YAxis
                    yAxisId="money"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`}
                  />
                  <Tooltip
                    cursor={{ fill: `color-mix(in oklch, ${colors.muted} 12%, transparent)` }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0]?.payload || {};
                      return (
                        <ChartTooltip
                          active
                          label={label}
                          payload={[
                            { name: 'Sản lượng', value: p.kWh, color: colors.bt },
                            { name: 'Tiền ước tính', value: p.money, color: colors.cd },
                          ]}
                          formatter={(v) =>
                            v > 50_000
                              ? `${v.toLocaleString('vi-VN')} ₫`
                              : `${fmtNum(v)} kWh`
                          }
                        />
                      );
                    }}
                  />
                  <Bar
                    yAxisId="kwh"
                    dataKey="kWh"
                    name="Sản lượng"
                    fill={colors.bt}
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="money"
                    name="Tiền ước tính"
                    stroke={colors.cd}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Chi tiết theo kỳ" subtitle={`${enriched.length} kỳ`} />
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Kỳ</th>
                <th className="px-4 py-2.5 text-left font-medium">Từ ngày</th>
                <th className="px-4 py-2.5 text-left font-medium">Đến ngày</th>
                <th className="px-4 py-2.5 text-right font-medium">Số ngày</th>
                <th className="px-4 py-2.5 text-right font-medium">Sản lượng (kWh)</th>
                <th className="px-4 py-2.5 text-right font-medium">Tiền ước tính</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                enriched.map((r, i) => (
                  <tr key={i} className="border-t border-border transition hover:bg-surface-2">
                    <td className="px-4 py-2.5 font-medium">{r.ky}</td>
                    <td className="px-4 py-2.5">{r.tungay || '—'}</td>
                    <td className="px-4 py-2.5">{r.denngay || '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.days}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                      {fmtNum(r.kWh)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-accent">
                      {fmtMoney(r.money)}
                    </td>
                  </tr>
                ))}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading && enriched.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
