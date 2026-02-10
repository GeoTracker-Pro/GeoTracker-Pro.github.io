'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tracker, LocationData, getTrackersAsync } from '@/lib/storage';
import {
  calculateTotalDistance,
  calculateAverageSpeed,
  calculateMaxSpeed,
  calculateSpeed,
  getTimeSpent,
  getLocationsByHour,
  getLocationsByDay,
} from '@/lib/analytics';
import styles from './page.module.css';

type SortField = 'timestamp' | 'latitude' | 'longitude' | 'accuracy';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 50;

function fmtDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (sec > 0 || parts.length === 0) parts.push(`${sec}s`);
  return parts.join(' ');
}

function fmtDate(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>('__all__');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [historyPage, setHistoryPage] = useState(0);
  const [speedPage, setSpeedPage] = useState(0);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Load trackers
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getTrackersAsync(user.uid);
        if (!cancelled) setTrackers(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Derived locations
  const locations: LocationData[] = useMemo(() => {
    if (selectedTrackerId === '__all__') {
      return trackers.flatMap((t) => t.locations ?? []);
    }
    const t = trackers.find((tr) => tr.id === selectedTrackerId);
    return t?.locations ?? [];
  }, [trackers, selectedTrackerId]);

  // Sorted locations for the history table
  const sortedLocations = useMemo(() => {
    const copy = [...locations];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'timestamp') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'latitude') {
        cmp = a.latitude - b.latitude;
      } else if (sortField === 'longitude') {
        cmp = a.longitude - b.longitude;
      } else {
        cmp = a.accuracy - b.accuracy;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [locations, sortField, sortDir]);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
      setHistoryPage(0);
    },
    [sortField]
  );

  // Analytics computations
  const totalDist = useMemo(() => calculateTotalDistance(locations), [locations]);
  const avgSpeed = useMemo(() => calculateAverageSpeed(locations), [locations]);
  const maxSpeed = useMemo(() => calculateMaxSpeed(locations), [locations]);
  const timeSpent = useMemo(() => getTimeSpent(locations), [locations]);
  const byHour = useMemo(() => getLocationsByHour(locations), [locations]);
  const byDay = useMemo(() => getLocationsByDay(locations), [locations]);

  // Speed log (consecutive pairs, sorted by time)
  const speedLog = useMemo(() => {
    const sorted = [...locations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const entries: { timestamp: string; speed: number; lat: number; lng: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      entries.push({
        timestamp: sorted[i].timestamp,
        speed: calculateSpeed(sorted[i - 1], sorted[i]),
        lat: sorted[i].latitude,
        lng: sorted[i].longitude,
      });
    }
    return entries;
  }, [locations]);

  // Bar chart max for scaling
  const hourMax = useMemo(() => {
    let m = 0;
    for (let h = 0; h < 24; h++) {
      if (byHour[h].length > m) m = byHour[h].length;
    }
    return m || 1;
  }, [byHour]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const historyTotal = sortedLocations.length;
  const historyPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE));
  const historySlice = sortedLocations.slice(
    historyPage * PAGE_SIZE,
    (historyPage + 1) * PAGE_SIZE
  );

  const speedTotal = speedLog.length;
  const speedPages = Math.max(1, Math.ceil(speedTotal / PAGE_SIZE));
  const speedSlice = speedLog.slice(speedPage * PAGE_SIZE, (speedPage + 1) * PAGE_SIZE);

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const dayKeys = Object.keys(byDay).sort();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>📊 Analytics</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← Dashboard
        </Link>
      </div>

      {/* Tracker selector */}
      <div className={styles.selectorRow}>
        <select
          className={styles.select}
          value={selectedTrackerId}
          onChange={(e) => {
            setSelectedTrackerId(e.target.value);
            setHistoryPage(0);
            setSpeedPage(0);
          }}
        >
          <option value="__all__">All Trackers</option>
          {trackers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name || t.id}
            </option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total Distance</div>
          <div className={styles.cardValue}>{(totalDist / 1000).toFixed(2)} km</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Average Speed</div>
          <div className={styles.cardValue}>{avgSpeed.toFixed(1)} km/h</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Max Speed</div>
          <div className={styles.cardValue}>{maxSpeed.toFixed(1)} km/h</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Tracking Time</div>
          <div className={styles.cardValue}>{fmtDuration(timeSpent)}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Location Points</div>
          <div className={styles.cardValue}>{locations.length}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total Trackers</div>
          <div className={styles.cardValue}>{trackers.length}</div>
        </div>
      </div>

      {/* Activity by Hour */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Activity by Hour</h2>
        {locations.length === 0 ? (
          <p className={styles.empty}>No data available</p>
        ) : (
          <div className={styles.barChart}>
            {Array.from({ length: 24 }, (_, h) => {
              const count = byHour[h].length;
              const pct = (count / hourMax) * 100;
              return (
                <div key={h} className={styles.barCol}>
                  <span className={styles.barCount}>{count > 0 ? count : ''}</span>
                  <div
                    className={styles.bar}
                    style={{ height: `${pct}%` }}
                    title={`${h}:00 – ${count} point${count !== 1 ? 's' : ''}`}
                  />
                  <span className={styles.barLabel}>{h}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Activity */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Daily Activity</h2>
        {dayKeys.length === 0 ? (
          <p className={styles.empty}>No data available</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {dayKeys.map((day) => (
                  <tr key={day}>
                    <td>{day}</td>
                    <td>{byDay[day].length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Speed Log */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Speed Log</h2>
        {speedLog.length === 0 ? (
          <p className={styles.empty}>Need at least 2 points to calculate speed</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Speed (km/h)</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {speedSlice.map((entry, i) => (
                    <tr key={`${entry.timestamp}-${i}`}>
                      <td>{fmtDate(entry.timestamp)}</td>
                      <td>{entry.speed.toFixed(1)}</td>
                      <td>{entry.lat.toFixed(6)}</td>
                      <td>{entry.lng.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {speedPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={speedPage === 0}
                  onClick={() => setSpeedPage((p) => p - 1)}
                >
                  ‹ Prev
                </button>
                <span className={styles.pageBtn}>
                  {speedPage + 1} / {speedPages}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={speedPage >= speedPages - 1}
                  onClick={() => setSpeedPage((p) => p + 1)}
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Location History */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Location History</h2>
        {locations.length === 0 ? (
          <p className={styles.empty}>No location data</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('timestamp')}>
                      Timestamp{sortIndicator('timestamp')}
                    </th>
                    <th onClick={() => toggleSort('latitude')}>
                      Latitude{sortIndicator('latitude')}
                    </th>
                    <th onClick={() => toggleSort('longitude')}>
                      Longitude{sortIndicator('longitude')}
                    </th>
                    <th onClick={() => toggleSort('accuracy')}>
                      Accuracy{sortIndicator('accuracy')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historySlice.map((loc, i) => (
                    <tr key={`${loc.timestamp}-${i}`}>
                      <td>{fmtDate(loc.timestamp)}</td>
                      <td>{loc.latitude.toFixed(6)}</td>
                      <td>{loc.longitude.toFixed(6)}</td>
                      <td>{loc.accuracy.toFixed(1)} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {historyPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={historyPage === 0}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  ‹ Prev
                </button>
                <span className={styles.pageBtn}>
                  {historyPage + 1} / {historyPages}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={historyPage >= historyPages - 1}
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
