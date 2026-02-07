'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Redirect to dashboard if already signed in, otherwise to login
      router.push(user ? '/dashboard' : '/login');
    }
  }, [router, user, loading]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundImage: 'url(https://res.cloudinary.com/dkj22lm1g/image/upload/v1770367388/map-image_adwbuo.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(5, 5, 16, 0.95) 0%, rgba(10, 10, 26, 0.92) 100%)'
      }} />
      <div className="spinner" style={{ position: 'relative', zIndex: 1 }}></div>
    </div>
  );
}
