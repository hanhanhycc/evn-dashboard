import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/cn';

export function CustomerSwitcher() {
  const { listPE, currentMakh, setCurrentMakh, currentCustomer } = useSession();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = listPE.filter((p) => {
    if (!q.trim()) return true;
    const s = `${p.MA_KHANG} ${p.TEN_KHANG} ${p.DIA_CHI}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left shadow-soft transition hover:bg-surface-2"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {currentCustomer?.TEN_KHANG || 'Chọn khách hàng'}
          </div>
          <div className="truncate text-xs text-muted">
            {currentMakh ? `Mã ${currentMakh}` : 'Chưa chọn'}
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-[min(28rem,90vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo mã, tên hoặc địa chỉ…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
            />
          </div>
          <ul className="max-h-72 overflow-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted">Không có kết quả</li>
            )}
            {filtered.map((p) => {
              const active = p.MA_KHANG === currentMakh;
              return (
                <li key={p.MA_KHANG}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMakh(p.MA_KHANG);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-2',
                      active && 'bg-primary-soft'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{p.TEN_KHANG}</span>
                        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-muted">
                          {p.MA_KHANG}
                        </span>
                      </div>
                      <div className="truncate text-xs text-muted">{p.DIA_CHI}</div>
                    </div>
                    {active && <Check className="mt-1 h-4 w-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
