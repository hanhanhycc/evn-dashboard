import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-surface-2 via-border to-surface-2 bg-[length:200%_100%]',
        className
      )}
      style={{ animationDuration: '1.5s' }}
    />
  );
}
