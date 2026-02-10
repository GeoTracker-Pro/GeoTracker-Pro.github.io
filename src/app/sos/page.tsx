'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentPosition } from '@/lib/storage';
import { reverseGeocode } from '@/lib/geocoding';
import styles from './page.module.css';

interface SOSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

type SOSStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SOSPage() {
  const [location, setLocation] = useState<SOSLocation | null>(null);
  const [status, setStatus] = useState<SOSStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !!navigator.share) {
      setCanShare(true);
    }
  }, []);

  const handleSOS = useCallback(async () => {
    setStatus('loading');
    setStatusMessage('Acquiring your location...');
    setLocation(null);

    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const loc: SOSLocation = {
        latitude: lat,
        longitude: lng,
        accuracy: position.coords.accuracy,
      };

      setLocation(loc);
      setStatus('success');
      setStatusMessage('Location acquired successfully');

      // Attempt reverse geocoding in background
      try {
        const result = await reverseGeocode(lat, lng);
        if (result) {
          setLocation(prev => prev ? { ...prev, address: result.displayName } : prev);
        }
      } catch {
        // Geocoding failure is non-critical
      }
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof Error) {
        setStatusMessage(err.message);
      } else {
        setStatusMessage('Failed to get location. Please ensure location access is enabled.');
      }
    }
  }, []);

  const getShareText = useCallback(() => {
    if (!location) return '';
    const mapsUrl = `https://maps.google.com/maps?${new URLSearchParams({ q: `${location.latitude},${location.longitude}` }).toString()}`;
    let text = `EMERGENCY: My location is ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} - ${mapsUrl}`;
    if (location.address) {
      text += ` (${location.address})`;
    }
    return text;
  }, [location]);

  const handleCopy = useCallback(async () => {
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  }, [getShareText]);

  const handleShare = useCallback(async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Emergency SOS', text });
      } catch {
        // User cancelled or share failed
      }
    }
  }, [getShareText]);

  const mapsUrl = location
    ? `https://maps.google.com/maps?${new URLSearchParams({ q: `${location.latitude},${location.longitude}` }).toString()}`
    : '';

  const embedUrl = location
    ? (() => {
        const params = new URLSearchParams({
          q: `${location.latitude},${location.longitude}`,
          z: '15',
          output: 'embed',
        });
        return `https://maps.google.com/maps?${params.toString()}`;
      })()
    : '';

  return (
    <div className={styles.sosBg}>
      <h1 className={styles.heading}>🆘 Emergency SOS</h1>
      <p className={styles.instructions}>Press the button to share your current location</p>

      <button
        className={styles.sosButton}
        onClick={handleSOS}
        disabled={status === 'loading'}
        aria-label="Emergency SOS - Get current location"
      >
        SOS
      </button>

      {status !== 'idle' && (
        <div
          className={`${styles.statusMsg} ${
            status === 'loading'
              ? styles.statusLoading
              : status === 'success'
              ? styles.statusSuccess
              : styles.statusError
          }`}
        >
          {status === 'loading' && '⏳ '}
          {status === 'success' && '✓ '}
          {status === 'error' && '✗ '}
          {statusMessage}
        </div>
      )}

      {location && (
        <div className={styles.resultSection}>
          <div className={styles.coords}>
            <p className={styles.label}>Coordinates</p>
            <p>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
            <p className={styles.label}>Accuracy: ±{location.accuracy.toFixed(0)}m</p>
            {location.address && (
              <p className={styles.address}>📍 {location.address}</p>
            )}
          </div>

          <div className={styles.mapContainer}>
            <iframe
              src={embedUrl}
              allowFullScreen
              loading="lazy"
              title="Emergency Location Map"
            ></iframe>
          </div>

          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={handleCopy}>
              📋 {copyFeedback || 'Copy Location Text'}
            </button>

            {canShare && (
              <button className={styles.actionBtn} onClick={handleShare}>
                📤 Share Location
              </button>
            )}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtn}
            >
              🗺️ Open in Google Maps
            </a>
          </div>
        </div>
      )}

      <Link href="/" className={styles.backLink}>
        ← Back to Home
      </Link>
    </div>
  );
}
