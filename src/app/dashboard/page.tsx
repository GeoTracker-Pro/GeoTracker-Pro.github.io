'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Tracker,
  getTrackers,
  createTracker,
  deleteTracker,
} from '@/lib/storage';
import styles from './page.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [trackerName, setTrackerName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  const loadTrackers = useCallback(() => {
    const storedTrackers = getTrackers();
    setTrackers(storedTrackers);
  }, []);

  useEffect(() => {
    // Check if user is "authenticated" (for static deployment, just check localStorage)
    const isAuth = localStorage.getItem('geotracker_authenticated');
    if (!isAuth) {
      router.push('/login');
      return;
    }

    setBaseUrl(window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || ''));
    loadTrackers();
    
    // Auto-refresh every 10 seconds to detect changes from other tabs
    const interval = setInterval(loadTrackers, 10000);
    return () => clearInterval(interval);
  }, [router, loadTrackers]);

  const handleCreateTracker = () => {
    if (!trackerName.trim()) {
      alert('Please enter a tracker name');
      return;
    }

    const tracker = createTracker(trackerName);
    const url = `${baseUrl}/track/?id=${tracker.id}`;
    setGeneratedUrl(url);
    setTrackerName('');
    loadTrackers();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const handleDeleteTracker = (trackerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this tracker?')) {
      return;
    }

    deleteTracker(trackerId);
    loadTrackers();
  };

  const handleLogout = () => {
    localStorage.removeItem('geotracker_authenticated');
    router.push('/login');
  };

  const viewOnMap = (lat: number, lng: number, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps?q=${lat},${lng}&z=15`, '_blank');
  };

  const toggleTrackerDetails = (trackerId: string) => {
    setExpandedTracker(expandedTracker === trackerId ? null : trackerId);
  };

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
              📱 Static Mode (localStorage)
            </span>
            <Link href="/tracker" className={styles.navLink}>
              📍 Standalone Tracker
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              🚪 Exit
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
                    {tracker.locations.length} locations
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteTracker(tracker.id, e)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className={styles.trackerInfo}>
                <div className={styles.infoItem}>
                  <strong>Created:</strong> {new Date(tracker.created).toLocaleString()}
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

              {expandedTracker === tracker.id && (
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
