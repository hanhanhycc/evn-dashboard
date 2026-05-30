import { Input } from './Input';
import { Button } from './Button';
import { endOfMonthIso, minusDaysIso, startOfMonthIso, todayIso, iso } from '@/lib/dates';

export type Preset = '7d' | '15d' | '30d' | 'thisMonth' | 'lastMonth' | 'ytd';

const PRESETS: { id: Preset; label: string; range: () => [string, string] }[] = [
  { id: '7d', label: '7 ngày', range: () => [minusDaysIso(6), todayIso()] },
  { id: '15d', label: '15 ngày', range: () => [minusDaysIso(14), todayIso()] },
  { id: '30d', label: '30 ngày', range: () => [minusDaysIso(29), todayIso()] },
  { id: 'thisMonth', label: 'Tháng này', range: () => [startOfMonthIso(0), todayIso()] },
  { id: 'lastMonth', label: 'Tháng trước', range: () => [startOfMonthIso(-1), endOfMonthIso(-1)] },
  {
    id: 'ytd',
    label: 'Năm nay',
    range: () => [iso(new Date(new Date().getFullYear(), 0, 1)), todayIso()],
  },
];

export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            size="sm"
            onClick={() => {
              const [f, t] = p.range();
              onChange(f, t);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">Từ ngày</span>
          <Input
            type="date"
            value={from}
            max={to}
            onChange={(e) => onChange(e.target.value, to)}
            className="h-9 w-[10.5rem]"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">Đến ngày</span>
          <Input
            type="date"
            value={to}
            min={from}
            max={todayIso()}
            onChange={(e) => onChange(from, e.target.value)}
            className="h-9 w-[10.5rem]"
          />
        </div>
      </div>
    </div>
  );
}
