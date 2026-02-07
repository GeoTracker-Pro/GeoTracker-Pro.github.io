'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is "authenticated"
    const isAuth = localStorage.getItem('geotracker_authenticated');
    if (!isAuth) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>👥 User Management</h1>
            <p className={styles.subtitle}>User management feature</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userInfo}>
              📱 Static Mode
            </span>
            <Link href="/dashboard" className={styles.navLink}>
              📍 Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.emptyState}>
          <p>⚠️ User management requires a server backend.</p>
          <p style={{ marginTop: '10px', color: '#666' }}>
            This static deployment uses localStorage for data storage.
            User management features are not available in static mode.
          </p>
          <Link href="/dashboard" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
