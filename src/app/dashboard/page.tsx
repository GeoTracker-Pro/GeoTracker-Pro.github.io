'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface DeviceInfo {
  browser: string;
  os: string;
  platform: string;
  screen: string;
  userAgent: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  deviceInfo?: DeviceInfo;
  ip?: string;
}

interface Tracker {
  _id: string;
  trackerId: string;
  name: string;
  locations: LocationData[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [trackerName, setTrackerName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, getAuthHeaders]);

  const loadTrackers = useCallback(async () => {
    try {
      const res = await fetch('/api/trackers', {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setTrackers(data.trackers);
      }
    } catch (error) {
      console.error('Failed to load trackers:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    setBaseUrl(window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || ''));
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      loadTrackers();
      // Auto-refresh every 10 seconds
      const interval = setInterval(loadTrackers, 10000);
      return () => clearInterval(interval);
    }
  }, [user, loadTrackers]);

  const handleCreateTracker = async () => {
    if (!trackerName.trim()) {
      alert('Please enter a tracker name');
      return;
    }

    try {
      const res = await fetch('/api/trackers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: trackerName }),
      });

      if (res.ok) {
        const data = await res.json();
        const url = `${baseUrl}/track/?id=${data.tracker.trackerId}`;
        setGeneratedUrl(url);
        setTrackerName('');
        loadTrackers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create tracker');
      }
    } catch (error) {
      console.error('Create tracker error:', error);
      alert('Failed to create tracker');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const handleDeleteTracker = async (trackerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this tracker?')) {
      return;
    }

    try {
      const res = await fetch(`/api/trackers/${trackerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        loadTrackers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete tracker');
      }
    } catch (error) {
      console.error('Delete tracker error:', error);
      alert('Failed to delete tracker');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('auth_token');
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

  if (loading) {
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
            <h1>📍 GeoTracker Dashboard</h1>
            <p className={styles.subtitle}>Create and manage location tracking links</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userInfo}>
              👤 {user?.name} ({user?.role})
            </span>
            {user?.role === 'admin' && (
              <Link href="/users" className={styles.navLink}>
                👥 Manage Users
              </Link>
            )}
            <Link href="/tracker" className={styles.navLink}>
              📍 Standalone Tracker
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div className={styles.createTracker}>
        <h2>Create New Tracker</h2>
        <div className={styles.formGroup}>
          <label htmlFor="trackerName">Tracker Name</label>
          <input
            type="text"
            id="trackerName"
            value={trackerName}
            onChange={(e) => setTrackerName(e.target.value)}
            placeholder="e.g., Family Trip, Lost Phone, Delivery Tracking"
            className={styles.input}
          />
        </div>
        <button className="btn" onClick={handleCreateTracker}>
          Create Tracking Link
        </button>

        {generatedUrl && (
          <div className={styles.generatedLink}>
            <h3>✓ Tracking Link Created!</h3>
            <p>Share this link to track location (updates every 15 seconds):</p>
            <div className={styles.linkText}>{generatedUrl}</div>
            <button className="btn btn-secondary" onClick={handleCopyLink}>
              Copy Link
            </button>
          </div>
        )}
      </div>

      <div className={styles.trackersList}>
        <h2>Active Trackers ({trackers.length})</h2>
        {trackers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📭</div>
            <p>No trackers yet. Create your first one above!</p>
          </div>
        ) : (
          trackers.map((tracker) => (
            <div
              key={tracker._id}
              className={styles.trackerCard}
              onClick={() => toggleTrackerDetails(tracker.trackerId)}
            >
              <div className={styles.trackerHeader}>
                <div>
                  <div className={styles.trackerName}>
                    {tracker.name}
                    {!tracker.isActive && <span className={styles.inactiveTag}>Inactive</span>}
                  </div>
                  <div className={styles.trackerId}>ID: {tracker.trackerId}</div>
                  {tracker.createdBy && (
                    <div className={styles.createdBy}>
                      By: {tracker.createdBy.name}
                    </div>
                  )}
                </div>
                <div className={styles.trackerActions}>
                  <span className={styles.locationsCount}>
                    {tracker.locations.length} locations
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteTracker(tracker.trackerId, e)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className={styles.trackerInfo}>
                <div className={styles.infoItem}>
                  <strong>Created:</strong> {new Date(tracker.createdAt).toLocaleString()}
                </div>
                <div className={styles.infoItem}>
                  <strong>Last Update:</strong>{' '}
                  {tracker.locations.length > 0
                    ? new Date(
                        tracker.locations[tracker.locations.length - 1].timestamp
                      ).toLocaleString()
                    : 'Never'}
                </div>
              </div>

              {expandedTracker === tracker.trackerId && (
                <div className={styles.trackerDetails}>
                  {tracker.locations.length > 0 ? (
                    tracker.locations.map((location, index) => (
                      <div key={index} className={styles.locationEntry}>
                        <div className={styles.locationTime}>
                          📅 {new Date(location.timestamp).toLocaleString()}
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
                    <p style={{ color: '#666' }}>No locations recorded yet.</p>
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
