'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const colors = {
    success: { bg: 'rgba(0, 255, 136, 0.15)', border: 'rgba(0, 255, 136, 0.5)', text: '#00ff88' },
    error: { bg: 'rgba(255, 51, 102, 0.15)', border: 'rgba(255, 51, 102, 0.5)', text: '#ff3366' },
    info: { bg: 'rgba(0, 204, 255, 0.15)', border: 'rgba(0, 204, 255, 0.5)', text: '#00ccff' },
  };

  const c = colors[toast.type];

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      padding: '12px 20px',
      borderRadius: 4,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 13,
      backdropFilter: 'blur(10px)',
      boxShadow: `0 0 20px ${c.border}`,
      pointerEvents: 'auto',
      animation: 'toastSlideIn 0.3s ease-out',
      maxWidth: 350,
      wordBreak: 'break-word',
    }}>
      {toast.type === 'success' && '✓ '}
      {toast.type === 'error' && '✗ '}
      {toast.type === 'info' && 'ℹ '}
      {toast.message}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
