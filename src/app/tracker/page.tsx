'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  LocationData,
  DeviceInfo,
  generateTrackingId,
  getDeviceInfo,
  getIPAddress,
  getCurrentPosition,
  getGeolocationErrorMessage,
  getOrCreateTrackerAsync,
  addLocationToTrackerAsync,
} from '@/lib/storage';
import styles from './page.module.css';

type Status = 'loading' | 'success' | 'error';

const SESSION_KEY = 'geotracker_standalone_id';

export default function StandaloneTracker() {
  const [status, setStatus] = useState<Status>('loading');
  const [statusMessage, setStatusMessage] = useState('Initializing tracking system...');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [ipAddress, setIpAddress] = useState('Scanning...');
  const [updateCount, setUpdateCount] = useState(0);
  const trackingIdRef = useRef<string | null>(null);
  const trackerReadyRef = useRef(false);

  // Save location data to the database
  const saveLocationToDatabase = useCallback(async (data: LocationData) => {
    const id = trackingIdRef.current;
    if (!id || !trackerReadyRef.current) return false;

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const success = await addLocationToTrackerAsync(id, data);
        if (success) {
          setUpdateCount((prev) => prev + 1);
          return true;
        }
      } catch {
        // Continue to retry
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    return false;
  }, []);

  const fetchLocation = useCallback(async () => {
    setStatus('loading');
    setStatusMessage('Acquiring target coordinates...');

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

      // Store location and device info in the database
      const saved = await saveLocationToDatabase(data);
      if (!saved && trackerReadyRef.current) {
        setStatusMessage('Location acquired but failed to sync to server');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'number' &&
        'message' in error
      ) {
        setStatusMessage(getGeolocationErrorMessage(error as GeolocationPositionError));
      } else if (error instanceof Error) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage('Signal acquisition failed.');
      }
      setStatus('error');
    }
  }, [saveLocationToDatabase]);

  // Keep a ref to fetchLocation so the effect always calls the latest version
  const fetchLocationRef = useRef(fetchLocation);
  fetchLocationRef.current = fetchLocation;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get or create a tracking ID persisted across page refreshes
    let id: string;
    let cancelled = false;
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        id = stored;
      } else {
        id = generateTrackingId();
        sessionStorage.setItem(SESSION_KEY, id);
      }
    } catch {
      // sessionStorage may be unavailable in private browsing or restricted contexts
      id = generateTrackingId();
    }
    trackingIdRef.current = id;

    const device = getDeviceInfo();
    setDeviceInfo(device);
    getIPAddress().then(setIpAddress);

    // Initialize tracker in the database, then fetch location
    const init = async () => {
      try {
        await getOrCreateTrackerAsync(id);
      } catch {
        // Proceed even if tracker init fails; addLocationToTrackerAsync
        // can create the document on the fly.
      }
      if (cancelled) return;
      trackerReadyRef.current = true;
      await fetchLocationRef.current();

      // Set up 15-second auto-update interval
      if (!cancelled) {
        intervalRef.current = setInterval(() => {
          fetchLocationRef.current();
        }, 15000);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const mapUrl = locationData
    ? (() => {
        const params = new URLSearchParams({
          q: `${locationData.latitude},${locationData.longitude}`,
          z: '15',
          output: 'embed'
        });
        return `https://maps.google.com/maps?${params.toString()}`;
      })()
    : '';

  return (
    <div className={styles.gradientBg}>
      <div className={styles.container}>
        <h1>🎯 Cyber Tracker</h1>
        <p className={styles.subtitle}>Standalone surveillance module</p>

        <div className={`status ${status}`}>
          {status === 'loading' && <div className="spinner"></div>}
          {status === 'success' && '✓ '}
          {status === 'error' && '✗ '}
          {statusMessage}
        </div>

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

            <button className="btn btn-rounded" onClick={fetchLocation}>
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
