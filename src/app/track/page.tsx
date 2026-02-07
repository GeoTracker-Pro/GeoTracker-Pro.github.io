'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  DeviceInfo,
  getDeviceInfo,
  getIPAddress,
  getCurrentPosition,
  getGeolocationErrorMessage,
  getOrCreateTracker,
  addLocationToTracker,
} from '@/lib/storage';
import styles from './page.module.css';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  deviceInfo?: DeviceInfo;
  ip?: string;
}

type Status = 'loading' | 'success' | 'error';

function TrackerContent() {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get('id');

  const [status, setStatus] = useState<Status>('loading');
  const [statusMessage, setStatusMessage] = useState('Initializing tracking system...');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [ipAddress, setIpAddress] = useState('Scanning...');
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trackerInitialized, setTrackerInitialized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tracker if needed and save location
  const saveLocationToStorage = useCallback((data: LocationData) => {
    if (!trackingId) return false;

    // Ensure tracker exists (creates if not)
    getOrCreateTracker(trackingId);
    
    const success = addLocationToTracker(trackingId, data);
    if (success) {
      setUpdateCount((prev) => prev + 1);
      setLastUpdate(new Date());
    }
    return success;
  }, [trackingId]);

  const fetchLocation = useCallback(async (isAutoUpdate = false) => {
    if (!isAutoUpdate) {
      setStatus('loading');
      setStatusMessage('Acquiring target coordinates...');
    }

    try {
      const position = await getCurrentPosition();
      const device = getDeviceInfo();
      const ip = await getIPAddress();

      const data: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
        deviceInfo: device,
        ip,
      };

      setLocationData(data);
      setDeviceInfo(device);
      setIpAddress(ip);
      setStatus('success');
      setStatusMessage('Target location acquired');

      // Save to localStorage
      if (trackingId) {
        saveLocationToStorage(data);
      }
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        setStatusMessage(getGeolocationErrorMessage(error));
      } else if (error instanceof Error) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage('Signal acquisition failed.');
      }
      setStatus('error');
    }
  }, [trackingId, saveLocationToStorage]);

  // Initialize tracker
  useEffect(() => {
    if (trackingId && !trackerInitialized) {
      // Auto-create tracker if it doesn't exist
      getOrCreateTracker(trackingId);
      setTrackerInitialized(true);
    }
  }, [trackingId, trackerInitialized]);

  useEffect(() => {
    const device = getDeviceInfo();
    setDeviceInfo(device);
    getIPAddress().then(setIpAddress);

    // Initial location fetch
    fetchLocation();

    // Set up 15-second auto-update interval
    if (trackingId) {
      intervalRef.current = setInterval(() => {
        fetchLocation(true);
      }, 15000); // 15 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [trackingId, fetchLocation]);

  const mapUrl = locationData
    ? `https://maps.google.com/maps?q=${locationData.latitude},${locationData.longitude}&z=15&output=embed`
    : '';

  return (
    <div className={styles.gradientBg}>
      <div className={styles.container}>
        <h1>🎯 Cyber Tracker</h1>
        <p className={styles.subtitle}>Real-time geolocation surveillance system</p>

        {trackingId && (
          <div className={styles.trackerInfo}>
            <p>🔗 <strong>Active Session:</strong> {trackingId.substring(0, 20)}...</p>
            <p>📡 Location data is being recorded to this session</p>
          </div>
        )}

        <div className={`status ${status}`}>
          {status === 'loading' && <div className="spinner"></div>}
          {status === 'success' && '✓ '}
          {status === 'error' && '✗ '}
          {statusMessage}
        </div>

        {trackingId && status === 'success' && (
          <div className={styles.autoUpdateStatus}>
            <div className={styles.pulse}></div>
            <span>Live tracking active • 15s intervals</span>
            {updateCount > 0 && (
              <span className={styles.updateCount}>
                [{updateCount} updates]
              </span>
            )}
            {lastUpdate && (
              <span className={styles.lastUpdate}>
                Last: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {locationData && (
          <div className={styles.locationInfo}>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-label">Latitude</div>
                <div className="info-value">{locationData.latitude.toFixed(6)}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Longitude</div>
                <div className="info-value">{locationData.longitude.toFixed(6)}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Accuracy</div>
                <div className="info-value">±{locationData.accuracy.toFixed(2)}m</div>
              </div>
              <div className="info-card">
                <div className="info-label">Timestamp</div>
                <div className="info-value">
                  {new Date(locationData.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="map-container">
              <iframe
                src={mapUrl}
                allowFullScreen
                loading="lazy"
                title="Location Map"
              ></iframe>
            </div>

            <button className="btn btn-rounded" onClick={() => fetchLocation()}>
              🔄 Refresh Coordinates
            </button>

            {deviceInfo && (
              <div className="device-info">
                <h3>📱 Device Intel</h3>
                <div className="device-details">
                  <div className="device-item">
                    <span className="device-label">Browser:</span>
                    <span className="device-value">{deviceInfo.browser}</span>
                  </div>
                  <div className="device-item">
                    <span className="device-label">Operating System:</span>
                    <span className="device-value">{deviceInfo.os}</span>
                  </div>
                  <div className="device-item">
                    <span className="device-label">Platform:</span>
                    <span className="device-value">{deviceInfo.platform}</span>
                  </div>
                  <div className="device-item">
                    <span className="device-label">Screen Resolution:</span>
                    <span className="device-value">{deviceInfo.screen}</span>
                  </div>
                  <div className="device-item">
                    <span className="device-label">IP Address:</span>
                    <span className="device-value">{ipAddress}</span>
                  </div>
                  <div className="device-item">
                    <span className="device-label">User Agent:</span>
                    <span
                      className="device-value"
                      style={{ fontSize: '10px', wordBreak: 'break-all' }}
                    >
                      {deviceInfo.userAgent}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Link href="/login" className={styles.backLink}>
          ← Return to Command Center
        </Link>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={
      <div className={styles.gradientBg}>
        <div className={styles.container}>
          <h1>🎯 Cyber Tracker</h1>
          <p className={styles.subtitle}>Initializing system...</p>
          <div className="spinner"></div>
        </div>
      </div>
    }>
      <TrackerContent />
    </Suspense>
  );
}
