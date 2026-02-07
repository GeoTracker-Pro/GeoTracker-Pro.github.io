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
            <h1>👥 User Registry</h1>
            <p className={styles.subtitle}>Personnel management module</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userInfo}>
              🔒 Secure Mode
            </span>
            <Link href="/dashboard" className={styles.navLink}>
              🎯 Command Center
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.emptyState}>
          <p>⚠️ User management requires server backend.</p>
          <p style={{ marginTop: '10px', color: '#666' }}>
            This static deployment uses localStorage for data storage.
            Multi-user management features are not available in this mode.
          </p>
          <Link href="/dashboard" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>
            ← Return to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
