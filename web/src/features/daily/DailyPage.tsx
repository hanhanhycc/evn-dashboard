import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Calendar, Flame, TrendingDown, Zap } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { useSession } from '@/hooks/useSession';
import { useApi } from '@/hooks/useApi';
import { useChartColors } from '@/hooks/useChartColors';
import { daysBetween, fmtNum, minusDaysIso, toApiDate, todayIso } from '@/lib/dates';
import { estimateBill } from '@/lib/pricing';
import type { DayResp, DayRow } from '@/lib/types';

export function DailyPage() {
  const { currentMakh } = useSession();
  const [from, setFrom] = useState(minusDaysIso(14));
  const [to, setTo] = useState(todayIso());
  const colors = useChartColors();

  const body = currentMakh
    ? { input_makh: currentMakh, input_tungay: toApiDate(from), input_denngay: toApiDate(to) }
    : null;

  const { data, loading, error, reload } = useApi<DayResp>(
    currentMakh ? '/api/dien/ngay' : null,
    body,
    [currentMakh, from, to]
  );

  const rows: DayRow[] = data?.data?.sanluong_tungngay || [];
  const days = daysBetween(from, to);

  const stats = useMemo(() => {
    let td = 0,
      bt = 0,
      cd = 0,
      total = 0,
      peakDay: { ngay: string; v: number } | null = null,
      minDay: { ngay: string; v: number } | null = null;
    for (const r of rows) {
      const t = Number(r.Tong || 0);
      td += Number(r.TD || 0);
      bt += Number(r.BT || 0);
      cd += Number(r.CD || 0);
      total += t;
      if (!peakDay || t > peakDay.v) peakDay = { ngay: r.ngayFull, v: t };
      if (t > 0 && (!minDay || t < minDay.v)) minDay = { ngay: r.ngayFull, v: t };
    }
    const avg = rows.length ? total / rows.length : 0;
    const bill = estimateBill(total, days);
    return { td, bt, cd, total, avg, peakDay, minDay, bill };
  }, [rows, days]);

  const peakKey = stats.peakDay?.ngay?.slice(0, 5); // dd/MM matches r.ngay
  const chartData = rows.map((r) => {
    const t = Number(r.Tong || 0);
    return {
      ngay: r.ngay,
      ngayFull: r.ngayFull,
      'Thấp điểm': Number(r.TD || 0),
      'Bình thường': Number(r.BT || 0),
      'Cao điểm': Number(r.CD || 0),
      total: t,
      isPeak: r.ngay === peakKey,
    };
  });

  // Auto-rotate x ticks when there are many days
  const xTick =
    chartData.length > 20
      ? { angle: -45, textAnchor: 'end' as const, height: 60 }
      : { angle: 0, textAnchor: 'middle' as const, height: 30 };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Tiêu thụ theo ngày</h1>
        <p className="mt-1 text-sm text-muted">
          Bóc tách sản lượng theo khung giờ Thấp điểm / Bình thường / Cao điểm cho khoảng ngày bạn
          chọn.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-end justify-between gap-4">
          <DateRangePicker
            from={from}
            to={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />
          <Button variant="soft" onClick={() => reload()}>
            Tra cứu lại
          </Button>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Tổng sản lượng"
          value={fmtNum(stats.total)}
          unit="kWh"
          hint={`${days} ngày · TB ${fmtNum(stats.avg)} kWh/ngày`}
          icon={<Zap className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Ước tính hóa đơn"
          value={stats.bill.total.toLocaleString('vi-VN')}
          unit="₫"
          hint={`Bao gồm VAT 8% · prorate ${days} ngày`}
          accent="accent"
          icon={<Flame className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Ngày cao nhất"
          value={stats.peakDay ? fmtNum(stats.peakDay.v) : '—'}
          unit="kWh"
          hint={stats.peakDay?.ngay || '—'}
          accent="warning"
          icon={<Activity className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Ngày thấp nhất"
          value={stats.minDay ? fmtNum(stats.minDay.v) : '—'}
          unit="kWh"
          hint={stats.minDay?.ngay || '—'}
          accent="success"
          icon={<TrendingDown className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Cao điểm / Tổng"
          value={
            stats.total > 0 ? ((stats.cd / stats.total) * 100).toFixed(1) : '0'
          }
          unit="%"
          hint={`CD ${fmtNum(stats.cd)} / BT ${fmtNum(stats.bt)} / TD ${fmtNum(stats.td)}`}
          accent="danger"
          icon={<Calendar className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader
          title="Biểu đồ ngày"
          subtitle={`Stacked theo khung giờ · ${chartData.length} ngày · TB ${fmtNum(stats.avg)} kWh/ngày`}
        />
        <CardBody>
          <div className="h-[440px]">
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
            ) : rows.length === 0 ? (
              <EmptyState description="Thử mở rộng khoảng ngày hoặc đổi mã khách hàng." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 28, right: 16, left: -4, bottom: 8 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="ngay"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={xTick.angle}
                    textAnchor={xTick.textAnchor}
                    height={xTick.height}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => fmtNum(v, 0)}
                    width={50}
                  />
                  {stats.avg > 0 && (
                    <ReferenceLine
                      y={stats.avg}
                      stroke={colors.muted}
                      strokeDasharray="4 4"
                      label={{
                        value: `TB ${fmtNum(stats.avg)} kWh`,
                        position: 'insideTopRight',
                        fill: colors.muted,
                        fontSize: 11,
                      }}
                    />
                  )}
                  <Tooltip
                    cursor={{ fill: `color-mix(in oklch, ${colors.muted} 12%, transparent)` }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0]?.payload as (typeof chartData)[number] | undefined;
                      if (!p) return null;
                      return (
                        <ChartTooltip
                          active
                          label={p.ngayFull}
                          payload={[
                            { name: 'Thấp điểm', value: p['Thấp điểm'], color: colors.td },
                            { name: 'Bình thường', value: p['Bình thường'], color: colors.bt },
                            { name: 'Cao điểm', value: p['Cao điểm'], color: colors.cd },
                            { name: 'Tổng', value: p.total, color: colors.fg },
                          ]}
                          formatter={(v) => `${fmtNum(v)} kWh`}
                        />
                      );
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
                  <Bar dataKey="Thấp điểm" stackId="a" fill={colors.td}>
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={colors.td}
                        opacity={d.isPeak ? 1 : 0.92}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="Bình thường" stackId="a" fill={colors.bt}>
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={colors.bt}
                        opacity={d.isPeak ? 1 : 0.92}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="Cao điểm" stackId="a" fill={colors.cd} radius={[6, 6, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={colors.cd}
                        opacity={d.isPeak ? 1 : 0.92}
                        stroke={d.isPeak ? colors.fg : 'transparent'}
                        strokeWidth={d.isPeak ? 1.5 : 0}
                      />
                    ))}
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => (v >= 1 ? fmtNum(v, 0) : '')}
                      style={{
                        fill: colors.fg,
                        fontSize: chartData.length > 20 ? 9 : 11,
                        fontWeight: 600,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Chi tiết theo ngày" subtitle={`${rows.length} dòng`} />
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Ngày</th>
                <th className="px-4 py-2.5 text-right font-medium">Thấp điểm</th>
                <th className="px-4 py-2.5 text-right font-medium">Bình thường</th>
                <th className="px-4 py-2.5 text-right font-medium">Cao điểm</th>
                <th className="px-4 py-2.5 text-right font-medium">Tổng (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading &&
                rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-border transition hover:bg-surface-2"
                  >
                    <td className="px-4 py-2.5 font-medium">{r.ngayFull}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(r.TD)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(r.BT)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(r.CD)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                      {fmtNum(r.Tong)}
                    </td>
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
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
