import { useCallback, useState } from 'react';

function normalizeMessage(value) {
  if (!value) return 'Something went wrong';
  if (typeof value === 'string') return value;
  if (value?.message) return value.message;
  return 'Something went wrong';
}

export function useAppToast() {
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message, tone = 'success') => {
    if (!message) return;
    setToast({ message, tone, id: Date.now() });
  }, []);

  const showError = useCallback(
    (error) => {
      showToast(normalizeMessage(error), 'error');
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message) => {
      showToast(message, 'success');
    },
    [showToast]
  );

  return { toast, showToast, showSuccess, showError, dismissToast };
}
