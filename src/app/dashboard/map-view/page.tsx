'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import {
  Tracker,
  LocationData,
  getTrackersAsync,
  subscribeToTrackers,
} from '@/lib/storage';
import styles from './page.module.css';

// Dynamically import the map component to avoid SSR issues with Leaflet
const TrackerMap = dynamic(() => import('./tracker-map'), { ssr: false });

export default function MapView() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);

  const loadTrackers = useCallback(async () => {
    if (permissionError) return;
    try {
      const storedTrackers = await getTrackersAsync();
      setTrackers(storedTrackers);
    } catch (error) {
      console.error('Error loading trackers:', error);
      if (error instanceof Error && error.message.includes('insufficient permissions')) {
        setPermissionError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [permissionError]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadTrackers();

      if (!permissionError) {
        let fallbackInterval: NodeJS.Timeout | null = null;
        const unsubscribe = subscribeToTrackers(
          (updatedTrackers) => {
            setTrackers(updatedTrackers);
            setLoading(false);
          },
          (error) => {
            console.error('Real-time subscription error:', error);
            if (error.message.includes('insufficient permissions')) {
              setPermissionError(true);
            }
            fallbackInterval = setInterval(loadTrackers, 10000);
          }
        );
        return () => {
          unsubscribe();
          if (fallbackInterval) clearInterval(fallbackInterval);
        };
      }
    }
  }, [router, loadTrackers, user, authLoading, permissionError]);

  const filteredTrackers = trackers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const trackersWithLocations = filteredTrackers.filter(
    (t) => t.locations.length > 0
  );

  const liveCount = trackers.filter((t) => {
    if (t.locations.length === 0) return false;
    const lastTime = new Date(t.locations[t.locations.length - 1].timestamp).getTime();
    return Date.now() - lastTime < 60000;
  }).length;

  const totalLocations = trackers.reduce((sum, t) => sum + t.locations.length, 0);

  if (authLoading || loading) {
    return (
      <div className={styles.mapViewBg}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mapViewBg}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>🗺️ Tracker Map View</h1>
            <p className={styles.subtitle}>All trackers displayed on interactive map</p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <Link href="/dashboard" className={styles.navLink}>
              🎯 Command Center
            </Link>
            <Link href="/tracker" className={styles.navLink}>
              📡 Quick Track
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Trackers</span>
          <span className={styles.statValue}>{trackers.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>With Locations</span>
          <span className={styles.statValue}>{trackersWithLocations.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Live Now</span>
          <span className={`${styles.statValue} ${styles.statValueLive}`}>{liveCount}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Coordinates</span>
          <span className={styles.statValue}>{totalLocations}</span>
        </div>
      </div>

      <div className={styles.mapLayout}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>📡 Tracker List</div>
            <input
              type="text"
              placeholder="🔍 Search trackers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.trackerList}>
            {filteredTrackers.length === 0 ? (
              <div className={styles.noTrackers}>
                {searchQuery ? 'No trackers match your search.' : 'No active trackers.'}
              </div>
            ) : (
              filteredTrackers.map((tracker) => {
                const hasLocations = tracker.locations.length > 0;
                const latestLoc = hasLocations
                  ? tracker.locations[tracker.locations.length - 1]
                  : null;
                const isLive = latestLoc
                  ? Date.now() - new Date(latestLoc.timestamp).getTime() < 60000
                  : false;

                return (
                  <div
                    key={tracker.id}
                    className={`${styles.trackerItem} ${selectedTrackerId === tracker.id ? styles.trackerItemActive : ''}`}
                    onClick={() => setSelectedTrackerId(
                      selectedTrackerId === tracker.id ? null : tracker.id
                    )}
                  >
                    <div className={styles.trackerItemName}>{tracker.name}</div>
                    <div className={styles.trackerItemId}>ID: {tracker.id.substring(0, 20)}...</div>
                    <div className={styles.trackerItemMeta}>
                      <span className={styles.coordsBadge}>
                        {tracker.locations.length} pts
                      </span>
                      {hasLocations && (
                        <span className={isLive ? styles.statusLive : styles.statusIdle}>
                          {isLive ? '● Live' : '○ Idle'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.mapContainer}>
          <TrackerMap
            trackers={filteredTrackers}
            selectedTrackerId={selectedTrackerId}
            onSelectTracker={setSelectedTrackerId}
          />
        </div>
      </div>
    </div>
  );
}
