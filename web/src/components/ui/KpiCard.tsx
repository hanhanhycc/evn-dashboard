import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';

export function KpiCard({
  label,
  value,
  unit,
  hint,
  delta,
  icon,
  loading,
  accent = 'primary',
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  delta?: number | null; // percent
  icon?: ReactNode;
  loading?: boolean;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const accentClass = {
    primary: 'bg-primary-soft text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/15 text-danger',
    accent: 'bg-accent/15 text-accent',
  }[accent];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <span className="text-2xl font-bold leading-none tracking-tight">{value}</span>
                {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
              </>
            )}
          </div>
          {hint && !loading && <p className="mt-1 text-xs text-muted">{hint}</p>}
          {delta != null && !loading && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                delta >= 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
              )}
            >
              {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {(delta >= 0 ? '+' : '') + delta.toFixed(1)}% so kỳ trước
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('grid h-10 w-10 place-items-center rounded-xl', accentClass)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
