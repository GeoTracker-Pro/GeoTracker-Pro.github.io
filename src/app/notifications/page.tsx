'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notification-context';
import type { AppNotification } from '@/lib/notifications';
import styles from './page.module.css';

type FilterType = 'all' | AppNotification['type'];

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'geofence', label: 'Geofence' },
  { value: 'tracker', label: 'Tracker' },
];

function getNotifIcon(type: string) {
  switch (type) {
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'geofence': return '📍';
    case 'tracker': return '📡';
    default: return 'ℹ️';
  }
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Unknown';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 className={styles.title}>🔔 Notifications</h1>
        </div>
        <div className={styles.headerRight}>
          {notifications.some((n) => !n.read) && (
            <button className={styles.actionBtn} onClick={markAllAsRead}>
              ✓ Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button className={styles.dangerBtn} onClick={clearAll}>
              🗑 Clear All
            </button>
          )}
        </div>
      </div>

      <div className={styles.filters}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.filterBtn} ${filter === opt.value ? styles.filterActive : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔕</div>
            <p className={styles.emptyText}>
              {filter === 'all'
                ? 'No notifications yet. Your alerts will appear here.'
                : `No ${filter} notifications found.`}
            </p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.card} ${styles[`card_${notif.type}`]} ${!notif.read ? styles.cardUnread : ''}`}
            >
              <div className={styles.cardIcon}>{getNotifIcon(notif.type)}</div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <span className={styles.cardTitle}>{notif.title}</span>
                  <span className={styles.cardTime}>{formatTimestamp(notif.timestamp)}</span>
                </div>
                <p className={styles.cardMessage}>{notif.message}</p>
                <div className={styles.cardActions}>
                  {!notif.read && (
                    <button
                      className={styles.smallBtn}
                      onClick={() => markAsRead(notif.id)}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    className={styles.smallDangerBtn}
                    onClick={() => deleteNotification(notif.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
