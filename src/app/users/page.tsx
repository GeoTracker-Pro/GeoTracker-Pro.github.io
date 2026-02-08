'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getUsersFromFirebase, deleteUserFromFirebase, User } from '@/lib/firebase-services';
import styles from './page.module.css';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'inbox.ashen@gmail.com';

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const showMessage = (message: string, error = false) => {
    setStatusMessage(message);
    setIsError(error);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const loadUsers = useCallback(async () => {
    try {
      const fetchedUsers = await getUsersFromFirebase();
      setUsers(fetchedUsers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadUsers();
    }
  }, [router, user, authLoading, loadUsers]);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userId === user?.uid) {
      showMessage('You cannot delete your own account.', true);
      return;
    }

    if (!confirm(`Are you sure you want to delete the user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await deleteUserFromFirebase(userId);
      if (success) {
        showMessage(`User "${userEmail}" has been deleted successfully.`);
        loadUsers();
      } else {
        showMessage('Failed to delete user. Please try again.', true);
      }
    } catch (error) {
      showMessage('Failed to delete user. Please try again.', true);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  const getTimeSince = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

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
              {isAdmin ? '🛡️ Super Admin' : '🔐 Firebase Connected'}
            </span>
            <Link href="/dashboard" className={styles.navLink}>
              🎯 Command Center
            </Link>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`${styles.statusMessage} ${isError ? styles.statusError : styles.statusSuccess}`}>
          {statusMessage}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarContent}>
            <h2 className={styles.sectionTitle}>Registered Personnel ({filteredUsers.length})</h2>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search users"
              />
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery ? (
              <>
                <p>🔍 No users found matching &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <p>📋 No registered users found.</p>
                <p style={{ marginTop: '10px', color: '#666' }}>
                  Users will appear here once they sign up and log in.
                </p>
              </>
            )}
            <Link href="/dashboard" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>
              ← Return to Command Center
            </Link>
          </div>
        ) : (
          <div className={styles.usersList}>
            {filteredUsers.map((registeredUser) => {
              const isCurrentUser = registeredUser.id === user?.uid;
              const isUserAdmin = registeredUser.email === ADMIN_EMAIL;

              return (
                <div key={registeredUser.id} className={styles.userCard}>
                  <div className={styles.userHeader}>
                    <div className={styles.userAvatar}>
                      {registeredUser.displayName?.[0]?.toUpperCase() || registeredUser.email[0]?.toUpperCase() || '?'}
                    </div>
                    <div className={styles.userDetails}>
                      <div className={styles.userName}>
                        {registeredUser.displayName || 'Unnamed Agent'}
                        {isCurrentUser && (
                          <span className={styles.currentBadge}>You</span>
                        )}
                        {isUserAdmin && (
                          <span className={styles.adminBadge}>Super Admin</span>
                        )}
                      </div>
                      <div className={styles.userEmail}>{registeredUser.email}</div>
                    </div>
                    <div className={styles.userCardActions}>
                      {isAdmin && !isCurrentUser && (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteUser(registeredUser.id, registeredUser.email)}
                          title="Delete user profile"
                          aria-label={`Delete user ${registeredUser.email}`}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.userMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>📅 Joined:</span>
                      <span className={styles.metaValue}>
                        {new Date(registeredUser.createdAt).toLocaleDateString()}
                      </span>
                      <span className={styles.metaAgo}>
                        ({getTimeSince(registeredUser.createdAt)})
                      </span>
                    </div>
                    {registeredUser.lastLoginAt && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>🕐 Last Active:</span>
                        <span className={styles.metaValue}>
                          {new Date(registeredUser.lastLoginAt).toLocaleString()}
                        </span>
                        <span className={styles.metaAgo}>
                          ({getTimeSince(registeredUser.lastLoginAt)})
                        </span>
                      </div>
                    )}
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>🆔 User ID:</span>
                      <span className={`${styles.metaValue} ${styles.metaSmall}`}>
                        {registeredUser.id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
