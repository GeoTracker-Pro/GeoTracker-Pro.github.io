'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Tracker,
  DeviceInfo,
  getDeviceInfo,
  getIPAddress,
  getCurrentPosition,
  getGeolocationErrorMessage,
  getOrCreateTrackerAsync,
  addLocationToTrackerAsync,
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
  const [trackerDetails, setTrackerDetails] = useState<Tracker | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);
  // Use a ref for trackerInitialized to avoid stale closures in callbacks
  const trackerInitializedRef = useRef(false);

  // Save location data to Firebase, with retry on failure
  const saveLocationToStorage = useCallback(async (data: LocationData) => {
    if (!trackingId || !trackerInitializedRef.current) return false;

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const success = await addLocationToTrackerAsync(trackingId, data);
        if (success) {
          setUpdateCount((prev) => prev + 1);
          setLastUpdate(new Date());
          return true;
        }
      } catch {
        // Continue to retry
      }
      // Exponential backoff before retrying (1s, 2s, 4s)
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    return false;
  }, [trackingId]);

  const fetchLocation = useCallback(async (isAutoUpdate = false) => {
    if (!trackerInitializedRef.current) return;

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

      // Save to Firebase
      if (trackingId) {
        const saved = await saveLocationToStorage(data);
        if (!saved) {
          setStatusMessage('Location acquired but failed to sync to server');
        }
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
  }, [trackingId, saveLocationToStorage]);

  // Keep a ref to fetchLocation so the effect always calls the latest version
  const fetchLocationRef = useRef(fetchLocation);
  fetchLocationRef.current = fetchLocation;

  // Single effect: initialize tracker, then start location tracking
  useEffect(() => {
    if (!trackingId || initializingRef.current) return;
    initializingRef.current = true;

    let cancelled = false;

    const initAndTrack = async () => {
      // Step 1: Initialize the tracker
      try {
        const tracker = await getOrCreateTrackerAsync(trackingId);
        if (cancelled) return;
        if (tracker) {
          setTrackerDetails(tracker);
        }
      } catch (error) {
        // Continue even if init fails — location tracking can still attempt
      }

      if (cancelled) return;

      // Mark tracker as initialized
      trackerInitializedRef.current = true;

      // Step 2: Gather device info
      const device = getDeviceInfo();
      setDeviceInfo(device);
      getIPAddress().then((ip) => {
        if (!cancelled) setIpAddress(ip);
      });

      // Step 3: Initial location fetch (directly after init, no separate effect)
      await fetchLocationRef.current();

      // Step 4: Set up 15-second auto-update interval
      if (!cancelled) {
        intervalRef.current = setInterval(() => {
          fetchLocationRef.current(true);
        }, 15000);
      }
    };

    initAndTrack();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [trackingId]);

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
        <p className={styles.subtitle}>Real-time geolocation surveillance system</p>

        {trackingId && (
          <div className={styles.trackerInfo}>
            {trackerDetails ? (
              <>
                <p>📋 <strong>Tracker:</strong> {trackerDetails.name}</p>
                <p>🕐 <strong>Created:</strong> {new Date(trackerDetails.created).toLocaleString()}</p>
                <p>🔗 <strong>Session ID:</strong> {trackingId.substring(0, 20)}...</p>
              </>
            ) : (
              <p>🔗 <strong>Session ID:</strong> {trackingId.substring(0, 20)}...</p>
            )}
            <p>📡 Location data is being recorded</p>
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
