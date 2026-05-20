import { useEffect } from 'react';

export default function DevToast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className="dev-toast-enter pointer-events-none fixed bottom-6 left-1/2 z-[130] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full border border-[#2A1814]/10 bg-[#2A1814] px-5 py-3 text-center text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
