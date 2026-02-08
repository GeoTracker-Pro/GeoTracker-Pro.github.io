'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Tracker,
  getTrackersAsync,
  createTrackerAsync,
  deleteTrackerAsync,
  subscribeToTrackersRealtime,
} from '@/lib/storage';
import styles from './page.module.css';

const FALLBACK_POLL_INTERVAL_MS = 30000;

// Safe date formatting helper
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackerName, setTrackerName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const showMessage = (message: string, error = false) => {
    setStatusMessage(message);
    setIsError(error);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const loadTrackers = useCallback(async () => {
    if (!user) return;
    try {
      // Show all trackers for any authenticated user (single-user mode)
      const storedTrackers = await getTrackersAsync();
      setTrackers(storedTrackers);
    } catch (error) {
      showMessage('Failed to load trackers. Please try again.', true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Use a ref for the fallback loader to avoid re-triggering the subscription effect
  const loadTrackersRef = useRef(loadTrackers);
  loadTrackersRef.current = loadTrackers;

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setBaseUrl(window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || ''));

      // Set up real-time Firestore listener for instant location updates
      // No userId filter - show all trackers (single-user mode)
      const unsubscribe = subscribeToTrackersRealtime(
        (updatedTrackers) => {
          setTrackers(updatedTrackers);
          setLoading(false);
          setRealtimeActive(true);
        },
        (error) => {
          // On real-time listener error, fall back to polling
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.error('Real-time listener failed, falling back to polling:', error);
          }
          setRealtimeActive(false);
          loadTrackersRef.current();
        }
      );

      unsubscribeRef.current = unsubscribe;

      // Fallback polling: periodically refresh data in case real-time listener
      // misses updates (e.g. due to network issues or listener disconnection)
      const pollInterval = setInterval(() => {
        loadTrackersRef.current();
      }, FALLBACK_POLL_INTERVAL_MS);

      return () => {
        unsubscribe();
        unsubscribeRef.current = null;
        clearInterval(pollInterval);
      };
    }
  }, [router, user, authLoading]);

  const handleCreateTracker = async () => {
    const trimmedName = trackerName.trim();
    
    if (!trimmedName) {
      showMessage('Please enter a tracker designation', true);
      return;
    }

    // Validate tracker name length
    if (trimmedName.length < 3) {
      showMessage('Tracker name must be at least 3 characters', true);
      return;
    }

    if (trimmedName.length > 50) {
      showMessage('Tracker name must be less than 50 characters', true);
      return;
    }

    // Comprehensive sanitization: only allow alphanumeric, spaces, hyphens, underscores
    // Remove any potentially dangerous characters
    const sanitizedName = trimmedName
      .replace(/[<>\"'`&;(){}[\]\\|]/g, '') // Remove HTML/script injection characters
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
    
    if (sanitizedName !== trimmedName) {
      showMessage('Tracker name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed.', true);
      return;
    }

    if (!sanitizedName) {
      showMessage('Tracker name is invalid after sanitization', true);
      return;
    }

    if (!user) {
      showMessage('You must be signed in to create a tracker.', true);
      return;
    }

    const tracker = await createTrackerAsync(sanitizedName, user.uid);
    if (tracker) {
      const url = `${baseUrl}/track?id=${tracker.id}`;
      setGeneratedUrl(url);
      setTrackerName('');
      // No need to manually reload — real-time listener will update automatically
      if (!realtimeActive) {
        loadTrackers();
      }
      showMessage('Tracker created successfully!');
    } else {
      showMessage('Failed to create tracker. Please try again.', true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      showMessage('Tracking link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showMessage('Tracking link copied to clipboard!');
      } catch (err) {
        showMessage('Failed to copy link. Please copy manually.', true);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDeleteTracker = async (trackerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to terminate this tracking session?')) {
      return;
    }

    await deleteTrackerAsync(trackerId);
    // No need to manually reload — real-time listener will update automatically
    if (!realtimeActive) {
      loadTrackers();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      showMessage('Failed to logout. Please try again.', true);
    }
  };

  const viewOnMap = (lat: number, lng: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams({ q: `${lat},${lng}`, z: '15' });
    window.open(`https://www.google.com/maps?${params.toString()}`, '_blank');
  };

  const toggleTrackerDetails = (trackerId: string) => {
    setExpandedTracker(expandedTracker === trackerId ? null : trackerId);
  };

  const getExportFilename = (tracker: Tracker, ext: string) => {
    const safeName = tracker.name.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    return `tracker-${safeName}-${date}.${ext}`;
  };

  const exportToJSON = (tracker: Tracker, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tracker.locations.length === 0) {
      showMessage('No location data to export.', true);
      return;
    }
    const data = {
      tracker: {
        id: tracker.id,
        name: tracker.name,
        created: tracker.created,
      },
      locations: tracker.locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: loc.timestamp,
        device: loc.deviceInfo ? {
          browser: loc.deviceInfo.browser,
          os: loc.deviceInfo.os,
          platform: loc.deviceInfo.platform,
          screen: loc.deviceInfo.screen,
        } : null,
        ip: loc.ip || null,
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getExportFilename(tracker, 'json');
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Location data exported as JSON!');
  };

  const exportToCSV = (tracker: Tracker, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tracker.locations.length === 0) {
      showMessage('No location data to export.', true);
      return;
    }
    const escapeCsvField = (field: string | null | undefined) => {
      const str = String(field ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const headers = ['Timestamp', 'Latitude', 'Longitude', 'Accuracy (m)', 'Browser', 'OS', 'Platform', 'Screen', 'IP Address'];
    const rows = tracker.locations.map(loc => [
      loc.timestamp,
      loc.latitude.toFixed(6),
      loc.longitude.toFixed(6),
      loc.accuracy.toFixed(2),
      loc.deviceInfo?.browser || '',
      loc.deviceInfo?.os || '',
      loc.deviceInfo?.platform || '',
      loc.deviceInfo?.screen || '',
      loc.ip || '',
    ].map(escapeCsvField));
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getExportFilename(tracker, 'csv');
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Location data exported as CSV!');
  };

  const filteredTrackers = useMemo(() => trackers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query)
    );
  }), [trackers, searchQuery]);

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

      {statusMessage && (
        <div className={`${styles.statusMessage} ${isError ? styles.error : styles.success}`}>
          {statusMessage}
        </div>
      )}

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
            aria-label="Tracker name input"
            aria-describedby="trackerNameHelp"
            maxLength={50}
            minLength={3}
          />
          <small id="trackerNameHelp" className={styles.helpText}>
            Enter a name between 3-50 characters
          </small>
        </div>
        <button 
          className="btn" 
          onClick={handleCreateTracker}
          aria-label="Generate tracking link button"
        >
          Generate Tracking Link
        </button>

        {generatedUrl && (
          <div className={styles.generatedLink}>
            <h3>✓ Tracking Link Generated</h3>
            <p>Share this secure link to begin surveillance (auto-updates every 15s):</p>
            <div className={styles.linkText}>{generatedUrl}</div>
            <button className="btn btn-secondary" onClick={handleCopyLink} aria-label="Copy tracking link to clipboard">
              📋 Copy Link
            </button>
          </div>
        )}
      </div>

      <div className={styles.trackersList}>
        <h2>
          Active Sessions ({searchQuery ? `${filteredTrackers.length}/${trackers.length}` : trackers.length})
          {realtimeActive && (
            <span className={styles.realtimeBadge}>
              <span className={styles.realtimePulse}></span>
              Real-time
            </span>
          )}
        </h2>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search trackers by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Search trackers"
          />
        </div>
        {filteredTrackers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📡</div>
            <p>No active tracking sessions. Initialize your first tracker above.</p>
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
                  {tracker.userId && (
                    <div className={styles.createdBy}>Owner: {tracker.userId}</div>
                  )}
                </div>
                <div className={styles.trackerActions}>
                  <span className={styles.locationsCount}>
                    {tracker.locations.length} location{tracker.locations.length !== 1 ? 's' : ''}
                  </span>
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
                  <strong>Initialized:</strong> {formatDate(tracker.created)}
                </div>
                <div className={styles.infoItem}>
                  <strong>Latest Update:</strong>{' '}
                  {tracker.locations.length > 0
                    ? formatDate(tracker.locations[0].timestamp)
                    : 'Awaiting...'}
                </div>
                <div className={styles.infoItem}>
                  <strong>Tracking Link:</strong>{' '}
                  <span
                    className={styles.trackerLink}
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = `${baseUrl}/track?id=${tracker.id}`;
                      navigator.clipboard.writeText(link).then(
                        () => showMessage('Tracking link copied!'),
                        () => showMessage('Failed to copy link.', true)
                      );
                    }}
                    title="Click to copy"
                  >
                    {baseUrl}/track?id={tracker.id}
                  </span>
                </div>
              </div>

              <div className={styles.realtimeLocation}>
                <div className={styles.realtimeHeader}>
                  <span className={styles.realtimePulse}></span>
                  <strong>Real-Time Location</strong>
                  <span className={styles.heartbeatInfo}>15s heartbeat</span>
                </div>
                {tracker.locations.length > 0 ? (
                  <>
                    <div className={styles.realtimeCoords}>
                      <div className={styles.coordItem}>
                        <div className={styles.coordLabel}>Latitude</div>
                        <div className={styles.coordValue}>
                          {tracker.locations[0].latitude.toFixed(6)}
                        </div>
                      </div>
                      <div className={styles.coordItem}>
                        <div className={styles.coordLabel}>Longitude</div>
                        <div className={styles.coordValue}>
                          {tracker.locations[0].longitude.toFixed(6)}
                        </div>
                      </div>
                      <div className={styles.coordItem}>
                        <div className={styles.coordLabel}>Accuracy</div>
                        <div className={styles.coordValue}>
                          ±{tracker.locations[0].accuracy.toFixed(2)}m
                        </div>
                      </div>
                      <div className={styles.coordItem}>
                        <div className={styles.coordLabel}>Last Synced</div>
                        <div className={styles.coordValue}>
                          {formatDate(tracker.locations[0].timestamp)}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-success"
                      onClick={(e) =>
                        viewOnMap(tracker.locations[0].latitude, tracker.locations[0].longitude, e)
                      }
                    >
                      🗺️ View Current Location
                    </button>
                  </>
                ) : (
                  <p className={styles.awaitingData}>
                    📡 No location data received yet. Share the tracking link to begin receiving coordinates.
                  </p>
                )}
              </div>

              {expandedTracker === tracker.id && (
                <div className={styles.trackerDetails}>
                  <div className={styles.exportActions}>
                    <button className="btn btn-secondary" onClick={(e) => exportToJSON(tracker, e)}>
                      📥 Export JSON
                    </button>
                    <button className="btn btn-secondary" onClick={(e) => exportToCSV(tracker, e)}>
                      📊 Export CSV
                    </button>
                  </div>
                  {tracker.locations.length > 0 ? (
                    tracker.locations.map((location, index) => (
                      <div key={index} className={styles.locationEntry}>
                        <div className={styles.locationTime}>
                          ⏱ {formatDate(location.timestamp)}
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
                    ))
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
