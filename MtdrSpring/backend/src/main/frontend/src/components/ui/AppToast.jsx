import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const AUTO_DISMISS_MS = 4500;
const EXIT_MS = 220;

export default function AppToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(null);
  const [exiting, setExiting] = useState(false);
  const exitTimerRef = useRef(null);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const requestDismiss = useCallback(() => {
    if (!visible || exiting) return;
    setExiting(true);
    clearExitTimer();
    exitTimerRef.current = window.setTimeout(() => {
      setVisible(null);
      setExiting(false);
      onDismiss();
    }, EXIT_MS);
  }, [visible, exiting, onDismiss, clearExitTimer]);

  useEffect(() => {
    if (toast) {
      clearExitTimer();
      setExiting(false);
      setVisible(toast);
    }
  }, [toast, clearExitTimer]);

  useEffect(() => {
    if (!toast && visible && !exiting) {
      requestDismiss();
    }
  }, [toast, visible, exiting, requestDismiss]);

  useEffect(() => {
    if (!visible || exiting) return undefined;
    const timer = window.setTimeout(requestDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [visible?.id, exiting, requestDismiss]);

  useEffect(() => () => clearExitTimer(), [clearExitTimer]);

  if (!visible) return null;

  const isError = visible.tone === 'error';

  return (
    <div
      className={`pointer-events-none fixed right-4 top-4 z-[140] flex w-[min(22rem,calc(100vw-2rem))] justify-end sm:right-6 sm:top-6 ${
        exiting ? 'app-toast-exit' : 'app-toast-enter'
      }`}
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_12px_40px_-16px_rgba(42,24,20,0.35)] ${
          isError
            ? 'border-[#c74634]/25 bg-[#fff6f4] text-[#2A1814]'
            : 'border-[#2A1814]/10 bg-white text-[#2A1814]'
        }`}
      >
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isError ? 'bg-[#c74634]/12 text-[#c74634]' : 'bg-emerald-50 text-emerald-700'
          }`}
          aria-hidden
        >
          {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </span>
        <p className="min-w-0 flex-1 pt-1 text-sm leading-snug">{visible.message}</p>
        <button
          type="button"
          onClick={requestDismiss}
          className="shrink-0 rounded-full p-1 text-[#6B6560] transition hover:bg-black/[0.04] hover:text-[#2A1814]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
