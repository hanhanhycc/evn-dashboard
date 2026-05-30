/**
 * Read CSS variables so Recharts can be themed via Tailwind tokens.
 * Recharts wants concrete colors at render time, so we read from :root.
 */
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

export function useChartColors() {
  const { resolved } = useTheme();
  const [, force] = useState(0);

  useEffect(() => {
    // bump on theme change so component re-reads CSS vars
    force((n) => n + 1);
  }, [resolved]);

  const read = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';

  return {
    td: read('--color-chart-1'),
    bt: read('--color-chart-2'),
    cd: read('--color-chart-3'),
    accent4: read('--color-chart-4'),
    primary: read('--color-primary'),
    muted: read('--color-muted'),
    border: read('--color-border'),
    surface: read('--color-surface'),
    fg: read('--color-fg'),
  };
}
