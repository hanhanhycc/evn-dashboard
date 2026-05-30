import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, TrendingUp, Zap } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { useSession } from '@/hooks/useSession';
import { useApi } from '@/hooks/useApi';
import { useChartColors } from '@/hooks/useChartColors';
import { fmtNum, minusDaysIso, toApiDate, todayIso } from '@/lib/dates';
import type { HourResp, HourRow } from '@/lib/types';

const loaiLabel: Record<string, string> = { td: 'Thấp điểm', bt: 'Bình thường', cd: 'Cao điểm' };

export function HourlyPage() {
  const { currentMakh } = useSession();
  const [day, setDay] = useState(minusDaysIso(1));
  const colors = useChartColors();

  const body = currentMakh ? { input_makh: currentMakh, input_ngay: toApiDate(day) } : null;
  const { data, loading, error, reload } = useApi<HourResp>(
    currentMakh ? '/api/dien/gio' : null,
    body,
    [currentMakh, day]
  );

  const rows: HourRow[] = data?.data || [];

  const chartData = rows.map((r) => ({
    gio: r.gio || r.thoidiem || '',
    loai: r.loai || 'bt',
    sl: Number(r.sanluong || r.SAN_LUONG || 0),
  }));

  const stats = useMemo(() => {
    let total = 0,
      peak: { gio: string; v: number } | null = null,
      off = 0;
    for (const r of chartData) {
      total += r.sl;
      if (!peak || r.sl > peak.v) peak = { gio: r.gio, v: r.sl };
      if (r.loai === 'td') off += r.sl;
    }
    return { total, peak, offShare: total > 0 ? (off / total) * 100 : 0 };
  }, [chartData]);

  // Build reference areas for TD/BT/CD bands from the contiguous run-lengths
  const bands = useMemo(() => {
    const segs: { from: string; to: string; loai: string }[] = [];
    if (chartData.length === 0) return segs;
    let start = 0;
    for (let i = 1; i <= chartData.length; i++) {
      if (i === chartData.length || chartData[i].loai !== chartData[start].loai) {
        segs.push({ from: chartData[start].gio, to: chartData[i - 1].gio, loai: chartData[start].loai });
        start = i;
      }
    }
    return segs;
  }, [chartData]);

  const bandColor = (loai: string) => {
    if (loai === 'td') return `color-mix(in oklch, ${colors.td} 14%, transparent)`;
    if (loai === 'cd') return `color-mix(in oklch, ${colors.cd} 16%, transparent)`;
    return 'transparent';
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Phụ tải theo giờ</h1>
        <p className="mt-1 text-sm text-muted">
          Đồ thị sản lượng từng 30 phút trong ngày, có dải màu cho khung Thấp điểm và Cao điểm.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-end justify-between gap-4">
          <Field label="Ngày" className="max-w-[14rem]">
            <Input
              type="date"
              value={day}
              max={todayIso()}
              onChange={(e) => setDay(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDay(minusDaysIso(1))}>
              Hôm qua
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDay(minusDaysIso(2))}>
              2 ngày trước
            </Button>
            <Button variant="soft" onClick={() => reload()}>
              Tra cứu lại
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Tổng sản lượng"
          value={fmtNum(stats.total)}
          unit="kWh"
          icon={<Zap className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Peak phút cao nhất"
          value={stats.peak ? fmtNum(stats.peak.v) : '—'}
          unit="kWh"
          hint={stats.peak?.gio || '—'}
          accent="warning"
          icon={<TrendingUp className="h-5 w-5" />}
          loading={loading}
        />
        <KpiCard
          label="Tỷ trọng giờ thấp điểm"
          value={stats.offShare.toFixed(1)}
          unit="%"
          accent="success"
          icon={<Clock className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader title="Đồ thị phụ tải 24h" subtitle="Mỗi điểm là 1 nửa giờ" />
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
            ) : chartData.length === 0 ? (
              <EmptyState description="EVN thường có độ trễ ~1 ngày, thử chọn ngày hôm qua." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="gio"
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(1, Math.floor(chartData.length / 8))}
                  />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v, 1)} />
                  {bands.map((b, i) => (
                    <ReferenceArea
                      key={i}
                      x1={b.from}
                      x2={b.to}
                      fill={bandColor(b.loai)}
                      strokeOpacity={0}
                    />
                  ))}
                  <Tooltip
                    cursor={{ stroke: colors.primary, strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0];
                      const loai = (p.payload?.loai || 'bt') as string;
                      return (
                        <ChartTooltip
                          active
                          label={`${label} · ${loaiLabel[loai] || loai}`}
                          payload={[{ name: 'Sản lượng', value: p.value, color: colors.primary }]}
                          formatter={(v) => `${fmtNum(v)} kWh`}
                        />
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sl"
                    name="Sản lượng"
                    stroke={colors.primary}
                    strokeWidth={2}
                    fill="url(#loadGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
            <Legend swatch={colors.td} label="Khung Thấp điểm" />
            <Legend swatch="transparent" label="Khung Bình thường" />
            <Legend swatch={colors.cd} label="Khung Cao điểm" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Chi tiết theo nửa giờ" subtitle={`${rows.length} mốc`} />
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Thời điểm</th>
                <th className="px-4 py-2.5 text-left font-medium">Biểu giá</th>
                <th className="px-4 py-2.5 text-right font-medium">Sản lượng (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                rows.map((r, i) => (
                  <tr key={i} className="border-t border-border transition hover:bg-surface-2">
                    <td className="px-4 py-2.5 font-medium">{r.gio || r.thoidiem}</td>
                    <td className="px-4 py-2.5">
                      <Badge loai={(r.loai as string) || 'bt'} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {fmtNum(r.sanluong || r.SAN_LUONG)}
                    </td>
                  </tr>
                ))}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 3 }).map((__, j) => (
                      <td key={j} className="px-4 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3}>
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

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded"
        style={{
          background: swatch === 'transparent' ? 'transparent' : swatch,
          border: swatch === 'transparent' ? '1px dashed var(--color-border)' : 'none',
        }}
      />
      {label}
    </span>
  );
}

function Badge({ loai }: { loai: string }) {
  const cls =
    loai === 'td'
      ? 'bg-success/15 text-success'
      : loai === 'cd'
      ? 'bg-danger/15 text-danger'
      : 'bg-surface-2 text-muted';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {loaiLabel[loai] || loai}
    </span>
  );
}
