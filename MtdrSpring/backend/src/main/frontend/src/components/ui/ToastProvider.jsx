import { createContext, useContext } from 'react';
import { useAppToast } from '../../hooks/useAppToast';
import AppToast from './AppToast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toastApi = useAppToast();

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <AppToast toast={toastApi.toast} onDismiss={toastApi.dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
