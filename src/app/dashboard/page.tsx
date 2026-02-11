'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Tracker,
  LocationData,
  getTrackersAsync,
  createTrackerAsync,
  deleteTrackerAsync,
} from '@/lib/storage';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters.toFixed(0)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

function totalDistance(locations: LocationData[]): string {
  let total = 0;
  for (let i = 1; i < locations.length; i++) {
    total += haversineDistance(
      locations[i - 1].latitude, locations[i - 1].longitude,
      locations[i].latitude, locations[i].longitude,
    );
  }
  return formatDistance(total);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportAsJSON(tracker: Tracker) {
  const data = JSON.stringify(tracker, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(tracker.name)}_${tracker.id}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function exportAsCSV(tracker: Tracker) {
  const headers = ['Timestamp', 'Latitude', 'Longitude', 'Accuracy (m)', 'Browser', 'OS', 'Platform', 'Screen', 'IP Address'];
  const rows = tracker.locations.map((loc) => [
    csvEscape(loc.timestamp),
    loc.latitude,
    loc.longitude,
    loc.accuracy,
    csvEscape(loc.deviceInfo?.browser || ''),
    csvEscape(loc.deviceInfo?.os || ''),
    csvEscape(loc.deviceInfo?.platform || ''),
    csvEscape(loc.deviceInfo?.screen || ''),
    csvEscape(loc.ip || ''),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(tracker.name)}_${tracker.id}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [trackerName, setTrackerName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    // Check if user is authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setBaseUrl(window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || ''));
      loadTrackers();
      
      // Auto-refresh every 10 seconds to detect changes
      if (!permissionError) {
        const interval = setInterval(loadTrackers, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [router, loadTrackers, user, authLoading, permissionError]);

  const handleCreateTracker = async () => {
    if (!trackerName.trim()) {
      showToast('Please enter a tracker designation', 'error');
      return;
    }

    const tracker = await createTrackerAsync(trackerName);
    if (tracker) {
      const url = `${baseUrl}/track?id=${tracker.id}`;
      setGeneratedUrl(url);
      setTrackerName('');
      loadTrackers();
      showToast('Tracker created successfully', 'success');
    } else {
      showToast('Failed to create tracker. Please try again.', 'error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      showToast('Tracking link copied to clipboard!', 'success');
    });
  };

  const handleDeleteTracker = async (trackerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to terminate this tracking session?')) {
      return;
    }

    await deleteTrackerAsync(trackerId);
    loadTrackers();
    showToast('Tracker deleted successfully', 'success');
  };

  const handleExportJSON = (tracker: Tracker, e: React.MouseEvent) => {
    e.stopPropagation();
    exportAsJSON(tracker);
    showToast(`Exported ${tracker.name} as JSON`, 'success');
  };

  const handleExportCSV = (tracker: Tracker, e: React.MouseEvent) => {
    e.stopPropagation();
    exportAsCSV(tracker);
    showToast(`Exported ${tracker.name} as CSV`, 'success');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const viewOnMap = (lat: number, lng: number, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps?q=${lat},${lng}&z=15`, '_blank');
  };

  const toggleTrackerDetails = (trackerId: string) => {
    setExpandedTracker(expandedTracker === trackerId ? null : trackerId);
  };

  const filteredTrackers = trackers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className={styles.dashboardBg}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardBg}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>🎯 Command Center</h1>
            <p className={styles.subtitle}>Surveillance operations dashboard</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userInfo}>
              👤 {user?.displayName || user?.email || 'Guest'}
            </span>
            <Link href="/tracker" className={styles.navLink}>
              📡 Quick Track
            </Link>
            <Link href="/users" className={styles.navLink}>
              👥 Users
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              ⏻ Disconnect
            </button>
          </div>
        </div>
      </div>

      <div className={styles.createTracker}>
        <h2>Initialize New Tracker</h2>
        <div className={styles.formGroup}>
          <label htmlFor="trackerName">Tracker Designation</label>
          <input
            type="text"
            id="trackerName"
            value={trackerName}
            onChange={(e) => setTrackerName(e.target.value)}
            placeholder="e.g., Operation Alpha, Asset Monitor, Field Unit"
            className={styles.input}
          />
        </div>
        <button className="btn" onClick={handleCreateTracker}>
          Generate Tracking Link
        </button>

        {generatedUrl && (
          <div className={styles.generatedLink}>
            <h3>✓ Tracking Link Generated</h3>
            <p>Share this secure link to begin surveillance (auto-updates every 15s):</p>
            <div className={styles.linkText}>{generatedUrl}</div>
            <button className="btn btn-secondary" onClick={handleCopyLink}>
              📋 Copy Link
            </button>
          </div>
        )}
      </div>

      <div className={styles.trackersList}>
        <div className={styles.trackersListHeader}>
          <h2>Active Sessions ({trackers.length})</h2>
          {trackers.length > 0 && (
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="🔍 Search trackers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}
        </div>
        {permissionError ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>⚠️</div>
            <p>Unable to access tracker data due to insufficient permissions.</p>
            <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              Please ensure Firestore security rules are properly configured.
              See FIREBASE_SETUP.md for setup instructions.
            </p>
            <button className="btn" onClick={() => { setPermissionError(false); loadTrackers(); }} style={{ marginTop: '15px' }}>
              🔄 Retry
            </button>
          </div>
        ) : filteredTrackers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📡</div>
            <p>{searchQuery ? 'No trackers match your search.' : 'No active tracking sessions. Initialize your first tracker above.'}</p>
          </div>
        ) : (
          filteredTrackers.map((tracker) => (
            <div
              key={tracker.id}
              className={styles.trackerCard}
              onClick={() => toggleTrackerDetails(tracker.id)}
            >
              <div className={styles.trackerHeader}>
                <div>
                  <div className={styles.trackerName}>
                    {tracker.name}
                  </div>
                  <div className={styles.trackerId}>ID: {tracker.id}</div>
                </div>
                <div className={styles.trackerActions}>
                  <span className={styles.locationsCount}>
                    {tracker.locations.length} coordinates
                  </span>
                  {tracker.locations.length > 1 && (
                    <span className={styles.distanceBadge}>
                      📏 {totalDistance(tracker.locations)}
                    </span>
                  )}
                  <button
                    className={styles.exportBtn}
                    onClick={(e) => handleExportJSON(tracker, e)}
                    title="Export as JSON"
                  >
                    {'{ }'}
                  </button>
                  <button
                    className={styles.exportBtn}
                    onClick={(e) => handleExportCSV(tracker, e)}
                    title="Export as CSV"
                  >
                    CSV
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteTracker(tracker.id, e)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className={styles.trackerInfo}>
                <div className={styles.infoItem}>
                  <strong>Initialized:</strong> {new Date(tracker.created).toLocaleString()}
                </div>
                <div className={styles.infoItem}>
                  <strong>Last Signal:</strong>{' '}
                  {tracker.locations.length > 0
                    ? new Date(
                        tracker.locations[tracker.locations.length - 1].timestamp
                      ).toLocaleString()
                    : 'Awaiting...'}
                </div>
              </div>

              {tracker.locations.length > 0 && (() => {
                const latestLocation = tracker.locations[tracker.locations.length - 1];
                const lastTime = new Date(latestLocation.timestamp).getTime();
                const isRecent = Date.now() - lastTime < 60000;
                return (
                  <div className={styles.latestLocationSummary}>
                    <div className={styles.latestLocationHeader}>
                      <span className={styles.latestLocationTitle}>📍 Latest Location</span>
                      <span className={isRecent ? styles.statusActive : styles.statusInactive}>
                        {isRecent ? '● Live' : '○ Idle'}
                      </span>
                    </div>
                    <div className={styles.latestLocationGrid}>
                      <div className={styles.latestLocationItem}>
                        <div className={styles.coordLabel}>Latitude</div>
                        <div className={styles.coordValue}>{latestLocation.latitude.toFixed(6)}</div>
                      </div>
                      <div className={styles.latestLocationItem}>
                        <div className={styles.coordLabel}>Longitude</div>
                        <div className={styles.coordValue}>{latestLocation.longitude.toFixed(6)}</div>
                      </div>
                      <div className={styles.latestLocationItem}>
                        <div className={styles.coordLabel}>Accuracy</div>
                        <div className={styles.coordValue}>±{latestLocation.accuracy.toFixed(2)}m</div>
                      </div>
                      {latestLocation.deviceInfo && (
                        <div className={styles.latestLocationItem}>
                          <div className={styles.coordLabel}>Device</div>
                          <div className={styles.coordValue}>
                            {latestLocation.deviceInfo.os} - {latestLocation.deviceInfo.browser}
                          </div>
                        </div>
                      )}
                      {latestLocation.ip && (
                        <div className={styles.latestLocationItem}>
                          <div className={styles.coordLabel}>IP Address</div>
                          <div className={styles.coordValue}>{latestLocation.ip}</div>
                        </div>
                      )}
                      {latestLocation.deviceInfo && (
                        <div className={styles.latestLocationItem}>
                          <div className={styles.coordLabel}>Screen</div>
                          <div className={styles.coordValue}>{latestLocation.deviceInfo.screen}</div>
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-success"
                      onClick={(e) => viewOnMap(latestLocation.latitude, latestLocation.longitude, e)}
                    >
                      🗺️ View Latest on Map
                    </button>
                  </div>
                );
              })()}

              {expandedTracker === tracker.id && (
                <div className={styles.trackerDetails}>
                  <div className={styles.locationHistoryHeader}>
                    📋 Location History ({tracker.locations.length} entries)
                    {tracker.locations.length > 1 && (
                      <span className={styles.totalDistance}>
                        Total: {totalDistance(tracker.locations)}
                      </span>
                    )}
                  </div>
                  {tracker.locations.length > 0 ? (
                    <div className={styles.timeline}>
                      {tracker.locations.map((location, index) => {
                        const dist = index > 0
                          ? haversineDistance(
                              tracker.locations[index - 1].latitude,
                              tracker.locations[index - 1].longitude,
                              location.latitude,
                              location.longitude,
                            )
                          : 0;
                        return (
                          <div key={index} className={styles.timelineItem}>
                            <div className={styles.timelineDot} />
                            {index < tracker.locations.length - 1 && (
                              <div className={styles.timelineLine} />
                            )}
                            <div className={styles.locationEntry}>
                              <div className={styles.locationTime}>
                                ⏱ {new Date(location.timestamp).toLocaleString()}
                                {index > 0 && (
                                  <span className={styles.segmentDistance}>
                                    +{formatDistance(dist)}
                                  </span>
                                )}
                              </div>
                              <div className={styles.locationCoords}>
                                <div className={styles.coordItem}>
                                  <div className={styles.coordLabel}>Latitude</div>
                                  <div className={styles.coordValue}>
                                    {location.latitude.toFixed(6)}
                                  </div>
                                </div>
                                <div className={styles.coordItem}>
                                  <div className={styles.coordLabel}>Longitude</div>
                                  <div className={styles.coordValue}>
                                    {location.longitude.toFixed(6)}
                                  </div>
                                </div>
                                <div className={styles.coordItem}>
                                  <div className={styles.coordLabel}>Accuracy</div>
                                  <div className={styles.coordValue}>
                                    ±{location.accuracy.toFixed(2)}m
                                  </div>
                                </div>
                              </div>
                              {location.deviceInfo && (
                                <div className={styles.locationCoords}>
                                  <div className={styles.coordItem}>
                                    <div className={styles.coordLabel}>Device</div>
                                    <div className={styles.coordValue}>
                                      {location.deviceInfo.os} - {location.deviceInfo.browser}
                                    </div>
                                  </div>
                                  <div className={styles.coordItem}>
                                    <div className={styles.coordLabel}>Screen</div>
                                    <div className={styles.coordValue}>
                                      {location.deviceInfo.screen}
                                    </div>
                                  </div>
                                  {location.ip && (
                                    <div className={styles.coordItem}>
                                      <div className={styles.coordLabel}>IP Address</div>
                                      <div className={styles.coordValue}>
                                        {location.ip}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <button
                                className="btn btn-success"
                                onClick={(e) =>
                                  viewOnMap(location.latitude, location.longitude, e)
                                }
                              >
                                🗺️ View on Map
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#666' }}>No location data received yet. Share the tracking link to begin receiving coordinates.</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
