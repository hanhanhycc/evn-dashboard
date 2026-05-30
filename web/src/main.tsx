import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { SessionProvider } from './hooks/useSession';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <SessionProvider>
          <App />
          <Toaster
            position="bottom-center"
            richColors
            closeButton
            theme="system"
            toastOptions={{ className: 'rounded-xl' }}
          />
        </SessionProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
