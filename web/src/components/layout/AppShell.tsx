import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, Clock, LayoutDashboard, LogOut, Zap } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { CustomerSwitcher } from './CustomerSwitcher';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const nav = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/daily', label: 'Theo ngày', icon: Calendar },
  { to: '/hourly', label: 'Theo giờ', icon: Clock },
  { to: '/billing', label: 'Kỳ hóa đơn', icon: BarChart3 },
];

export function AppShell() {
  const { logout } = useSession();
  const nav2 = useNavigate();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar (desktop) — sticky full-viewport, scrolls independently */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start overflow-y-auto border-r border-border bg-surface px-4 py-5 md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg shadow-soft">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">EVN Dashboard</div>
            <div className="text-[11px] text-muted">Tiêu thụ điện cá nhân</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted hover:bg-surface-2 hover:text-fg'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
              nav2('/login', { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="md:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1">
            <CustomerSwitcher />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>

        {/* Bottom tab bar (mobile) */}
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur md:hidden">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] transition',
                  isActive ? 'text-primary' : 'text-muted'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
