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
  const [statusMessage, setStatusMessage] = useState('Requesting location access...');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [ipAddress, setIpAddress] = useState('Loading...');
  const [trackerExists, setTrackerExists] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Send location to server API
  const sendLocationToServer = useCallback(async (data: LocationData) => {
    if (!trackingId) return;

    try {
      const res = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackerId: trackingId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: data.timestamp,
          deviceInfo: data.deviceInfo,
          ip: data.ip,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        if (res.status === 404) {
          setTrackerExists(false);
        }
        console.error('Failed to send location:', result.error);
        return false;
      }

      setUpdateCount((prev) => prev + 1);
      setLastUpdate(new Date());
      return true;
    } catch (error) {
      console.error('Failed to send location to server:', error);
      return false;
    }
  }, [trackingId]);

  const fetchLocation = useCallback(async (isAutoUpdate = false) => {
    if (!isAutoUpdate) {
      setStatus('loading');
      setStatusMessage('Requesting location access...');
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
      setStatusMessage('Location captured successfully!');

      // Send to MongoDB API
      if (trackingId) {
        await sendLocationToServer(data);
      }
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        setStatusMessage(getGeolocationErrorMessage(error));
      } else if (error instanceof Error) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage('An unknown error occurred.');
      }
      setStatus('error');
    }
  }, [trackingId, sendLocationToServer]);

  // Check if tracker exists on server
  const checkTrackerExists = useCallback(async () => {
    if (!trackingId) return;

    try {
      const res = await fetch(`/api/trackers/${trackingId}`);
      if (!res.ok) {
        setTrackerExists(false);
      }
    } catch {
      console.error('Failed to check tracker');
    }
  }, [trackingId]);

  useEffect(() => {
    const device = getDeviceInfo();
    setDeviceInfo(device);
    getIPAddress().then(setIpAddress);

    // Check if tracker exists on server
    if (trackingId) {
      checkTrackerExists();
    }

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
  }, [trackingId, fetchLocation, checkTrackerExists]);

  const mapUrl = locationData
    ? `https://maps.google.com/maps?q=${locationData.latitude},${locationData.longitude}&z=15&output=embed`
    : '';

  return (
    <div className={styles.gradientBg}>
      <div className={styles.container}>
        <h1>📍 Location Tracker</h1>
        <p className={styles.subtitle}>Share your location securely</p>

        {!trackerExists && trackingId && (
          <div className={`status error`}>
            ⚠️ Tracker not found. The tracking link may be invalid or expired.
            <br />
            <Link href="/login" className={styles.dashboardLink}>
              Go to Dashboard to create a new tracker →
            </Link>
          </div>
        )}

        <div className={`status ${status}`}>
          {status === 'loading' && <div className="spinner"></div>}
          {status === 'success' && '✓ '}
          {status === 'error' && '✗ '}
          {statusMessage}
        </div>

        {trackingId && trackerExists && status === 'success' && (
          <div className={styles.autoUpdateStatus}>
            <div className={styles.pulse}></div>
            <span>Auto-updating every 15 seconds</span>
            {updateCount > 0 && (
              <span className={styles.updateCount}>
                ({updateCount} updates sent)
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
              🔄 Refresh Location
            </button>

            {deviceInfo && (
              <div className="device-info">
                <h3>Device Information</h3>
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
                      style={{ fontSize: '11px', wordBreak: 'break-all' }}
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
          ← Back to Dashboard
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
          <h1>📍 Location Tracker</h1>
          <p className={styles.subtitle}>Loading...</p>
          <div className="spinner"></div>
        </div>
      </div>
    }>
      <TrackerContent />
    </Suspense>
  );
}
