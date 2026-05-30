import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type Theme } from './ThemeProvider';
import { cn } from '@/lib/cn';

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Sáng' },
  { value: 'system', icon: Monitor, label: 'Hệ thống' },
  { value: 'dark', icon: Moon, label: 'Tối' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 shadow-soft">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          title={label}
          aria-label={`Chế độ ${label}`}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-full transition',
            theme === value
              ? 'bg-primary text-primary-fg shadow-soft'
              : 'text-muted hover:text-fg'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
