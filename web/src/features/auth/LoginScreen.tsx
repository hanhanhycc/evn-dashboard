import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

type FormValues = { sdt: string; password: string; remember: boolean };

export function LoginScreen() {
  const { login } = useSession();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [showPw, setShowPw] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { sdt: '', password: '', remember: true } });

  const onSubmit = handleSubmit(async (values) => {
    setServerErr(null);
    try {
      await login(values.sdt.trim(), values.password, values.remember);
      nav(loc.state?.from || '/', { replace: true });
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : 'Đăng nhập thất bại');
    }
  });

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-accent text-primary-fg lg:flex lg:flex-col lg:p-12">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,white_0,transparent_45%)]" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Zap className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">EVN Dashboard</span>
        </div>

        <div className="relative z-10 mt-auto max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Theo dõi tiêu thụ điện
            <br />
            <span className="text-white/80">gọn, đẹp, riêng tư.</span>
          </h1>
          <p className="mt-4 text-white/80">
            Mọi dữ liệu chỉ đi qua máy của bạn. Không lưu mật khẩu, không gửi đi đâu khác ngoài
            EVNHCMC.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <span>KPI trực quan, biểu đồ ngày · giờ · kỳ hóa đơn.</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Ước tính tiền điện bậc thang sinh hoạt theo từng kỳ.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Cookie phiên chỉ tồn tại trong RAM của server cục bộ.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg">
                <Zap className="h-5 w-5" />
              </div>
              <span className="font-bold">EVN Dashboard</span>
            </div>
            <ThemeToggle />
          </div>
          <div className="mb-8 hidden lg:flex lg:justify-end">
            <ThemeToggle />
          </div>

          <h2 className="text-2xl font-bold">Đăng nhập</h2>
          <p className="mt-1 text-sm text-muted">
            Sử dụng tài khoản EVNHCMC (số điện thoại + mật khẩu).
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field
              label="Số điện thoại"
              error={errors.sdt?.message}
            >
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                placeholder="0912 345 678"
                {...register('sdt', {
                  required: 'Vui lòng nhập số điện thoại',
                  pattern: { value: /^[0-9+\s]{8,15}$/, message: 'Số điện thoại không hợp lệ' },
                })}
              />
            </Field>

            <Field label="Mật khẩu" error={errors.password?.message}>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-surface-2"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-[var(--color-primary)]"
                {...register('remember')}
              />
              Ghi nhớ phiên đăng nhập
            </label>

            {serverErr && (
              <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {serverErr}
              </div>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Đăng nhập
            </Button>

            <p className="text-center text-xs text-muted">
              Thông tin chỉ được gửi đến server cục bộ và proxy tới{' '}
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">
                evnhcmc.vn
              </code>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
