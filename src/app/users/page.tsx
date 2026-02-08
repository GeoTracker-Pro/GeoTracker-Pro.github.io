'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getUsersFromFirebase, User } from '@/lib/firebase-services';
import styles from './page.module.css';

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const loadUsers = async () => {
      try {
        const fetchedUsers = await getUsersFromFirebase();
        setUsers(fetchedUsers);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadUsers();
    }
  }, [router, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

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
              🔐 Firebase Connected
            </span>
            <Link href="/dashboard" className={styles.navLink}>
              🎯 Command Center
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {users.length === 0 ? (
          <div className={styles.emptyState}>
            <p>📋 No registered users found.</p>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Users will appear here once they sign up and log in.
            </p>
            <Link href="/dashboard" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>
              ← Return to Command Center
            </Link>
          </div>
        ) : (
          <div className={styles.usersList}>
            <h2>Registered Personnel ({users.length})</h2>
            {users.map((registeredUser) => (
              <div key={registeredUser.id} className={styles.userCard}>
                <div className={styles.userHeader}>
                  <div className={styles.userAvatar}>
                    {registeredUser.displayName?.[0]?.toUpperCase() || registeredUser.email[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={styles.userDetails}>
                    <div className={styles.userName}>
                      {registeredUser.displayName || 'Unnamed Agent'}
                      {registeredUser.id === user?.uid && (
                        <span className={styles.currentBadge}>You</span>
                      )}
                    </div>
                    <div className={styles.userEmail}>{registeredUser.email}</div>
                  </div>
                </div>
                <div className={styles.userMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Joined:</span>
                    <span className={styles.metaValue}>
                      {new Date(registeredUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {registeredUser.lastLoginAt && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Last Active:</span>
                      <span className={styles.metaValue}>
                        {new Date(registeredUser.lastLoginAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
