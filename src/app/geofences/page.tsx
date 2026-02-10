'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tracker, getTrackersAsync } from '@/lib/storage';
import {
  Geofence,
  GeofenceEvent,
  getGeofences,
  saveGeofence,
  deleteGeofence,
  getGeofenceEvents,
  clearGeofenceEvents,
} from '@/lib/geofence';
import styles from './page.module.css';

function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function GeofencesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [onEntry, setOnEntry] = useState(true);
  const [onExit, setOnExit] = useState(true);
  const [trackerId, setTrackerId] = useState('');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const refreshData = useCallback(() => {
    setGeofences(getGeofences());
    setEvents(getGeofenceEvents());
  }, []);

  // Load trackers and geofences
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
    refreshData();
    return () => {
      cancelled = true;
    };
  }, [user, refreshData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);
    if (!name.trim() || isNaN(lat) || isNaN(lng) || isNaN(rad) || rad <= 0) return;

    const sanitizedName = name.trim().replace(/[<>"'`&;(){}[\]\\|]/g, '').replace(/[\x00-\x1F\x7F]/g, '');

    const geofence: Geofence = {
      id: crypto.randomUUID(),
      name: sanitizedName,
      latitude: lat,
      longitude: lng,
      radius: rad,
      type: 'circle',
      createdAt: new Date().toISOString(),
      trackerId: trackerId || undefined,
      alerts: { onEntry, onExit },
    };

    saveGeofence(geofence);
    setName('');
    setLatitude('');
    setLongitude('');
    setRadius('100');
    setOnEntry(true);
    setOnExit(true);
    setTrackerId('');
    refreshData();
  };

  const handleDelete = (id: string) => {
    deleteGeofence(id);
    refreshData();
  };

  const handleClearEvents = () => {
    clearGeofenceEvents();
    refreshData();
  };

  if (authLoading || (!user && !authLoading)) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (loading) {
    return <div className={styles.loading}>Loading geofences...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>📍 Geofences</h1>
            <p className={styles.subtitle}>Virtual perimeter monitoring</p>
          </div>
          <Link href="/dashboard" className={styles.backLink}>
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* Create Geofence Form */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Create Geofence</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroupFull}>
            <label className={styles.label} htmlFor="gf-name">Name</label>
            <input
              id="gf-name"
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Office, Home"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="gf-lat">Latitude</label>
            <input
              id="gf-lat"
              className={styles.input}
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 40.7128"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="gf-lng">Longitude</label>
            <input
              id="gf-lng"
              className={styles.input}
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. -74.0060"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="gf-radius">Radius (meters)</label>
            <input
              id="gf-radius"
              className={styles.input}
              type="number"
              min="1"
              step="any"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="gf-tracker">Tracker (optional)</label>
            <select
              id="gf-tracker"
              className={styles.select}
              value={trackerId}
              onChange={(e) => setTrackerId(e.target.value)}
            >
              <option value="">All trackers</option>
              {trackers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.id}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Alerts</label>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="gf-entry"
                checked={onEntry}
                onChange={(e) => setOnEntry(e.target.checked)}
              />
              <label htmlFor="gf-entry">🟢 On Entry</label>
            </div>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="gf-exit"
                checked={onExit}
                onChange={(e) => setOnExit(e.target.checked)}
              />
              <label htmlFor="gf-exit">🔴 On Exit</label>
            </div>
          </div>
          <button type="submit" className={styles.submitBtn}>
            Create Geofence
          </button>
        </form>
      </section>

      {/* Geofence List */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Geofences ({geofences.length})</h2>
        {geofences.length === 0 ? (
          <p className={styles.emptyState}>No geofences created yet. Create one above.</p>
        ) : (
          <div className={styles.geofenceGrid}>
            {geofences.map((gf) => (
              <div key={gf.id} className={styles.geofenceCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardName}>{gf.name}</h3>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(gf.id)}
                  >
                    Delete
                  </button>
                </div>
                <p className={styles.cardDetail}>
                  Center: <span>{gf.latitude.toFixed(6)}, {gf.longitude.toFixed(6)}</span>
                </p>
                <p className={styles.cardDetail}>
                  Radius: <span>{gf.radius}m</span>
                </p>
                {gf.trackerId && (
                  <p className={styles.cardDetail}>
                    Tracker: <span>{gf.trackerId}</span>
                  </p>
                )}
                <div className={styles.alertBadges}>
                  {gf.alerts.onEntry && (
                    <span className={`${styles.badge} ${styles.badgeEntry}`}>🟢 Entry</span>
                  )}
                  {gf.alerts.onExit && (
                    <span className={`${styles.badge} ${styles.badgeExit}`}>🔴 Exit</span>
                  )}
                </div>
                <iframe
                  className={styles.mapEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?${new URLSearchParams({ q: `${gf.latitude},${gf.longitude}`, z: '15', output: 'embed' }).toString()}`}
                  title={`Map for ${gf.name.replace(/[<>"']/g, '')}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Events */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Events</h2>
          {events.length > 0 && (
            <button className={styles.clearBtn} onClick={handleClearEvents}>
              Clear Events
            </button>
          )}
        </div>
        {events.length === 0 ? (
          <p className={styles.emptyState}>No geofence events recorded yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Geofence</th>
                  <th>Coordinates</th>
                  <th>Tracker</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {[...events].reverse().map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span className={ev.type === 'entry' ? styles.entryType : styles.exitType}>
                        {ev.type === 'entry' ? '🟢 Entry' : '🔴 Exit'}
                      </span>
                    </td>
                    <td>{ev.geofenceName}</td>
                    <td>{ev.latitude.toFixed(6)}, {ev.longitude.toFixed(6)}</td>
                    <td>{ev.trackerId ?? '—'}</td>
                    <td>{formatDate(ev.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
