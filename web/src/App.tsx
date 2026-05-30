import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import { AppShell } from './components/layout/AppShell';
import { LoginScreen } from './features/auth/LoginScreen';
import { OverviewPage } from './features/overview/OverviewPage';
import { DailyPage } from './features/daily/DailyPage';
import { HourlyPage } from './features/hourly/HourlyPage';
import { BillingPage } from './features/billing/BillingPage';

function FullscreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="flex items-center gap-3 text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        Đang khôi phục phiên…
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authed, ready } = useSession();
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    if (ready && !authed) nav('/login', { replace: true, state: { from: loc.pathname } });
  }, [ready, authed, nav, loc.pathname]);
  if (!ready) return <FullscreenLoader />;
  if (!authed) return null;
  return <>{children}</>;
}

export default function App() {
  const { ready, authed } = useSession();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          ready && authed ? <Navigate to="/" replace /> : <LoginScreen />
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/hourly" element={<HourlyPage />} />
        <Route path="/billing" element={<BillingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
