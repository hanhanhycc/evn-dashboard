import type { ReactNode } from 'react';
import { Card } from './Card';

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: ReactNode;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload || !payload.length) return null;
  const fmt = formatter ?? ((v: number) => v.toLocaleString('vi-VN'));
  return (
    <Card className="px-3 py-2 text-xs shadow-pop">
      {label != null && <div className="mb-1 font-semibold">{label}</div>}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color || p.fill }}
            />
            <span className="text-muted">{p.name}:</span>
            <span className="font-medium">{fmt(Number(p.value || 0))}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
