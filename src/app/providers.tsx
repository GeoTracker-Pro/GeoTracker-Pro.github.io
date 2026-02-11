'use client';

import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { GeofenceProvider } from '@/lib/geofence-context';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GeofenceProvider>
          <ToastProvider>{children}</ToastProvider>
        </GeofenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
