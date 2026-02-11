'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Geofence {
  id: string;
  trackerId: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  name: string;
  createdAt: string;
}

export interface GeofenceAlert {
  id: string;
  geofenceId: string;
  trackerId: string;
  type: 'enter' | 'exit';
  latitude: number;
  longitude: number;
  timestamp: string;
  geofenceName: string;
}

interface GeofenceContextType {
  geofences: Geofence[];
  alerts: GeofenceAlert[];
  addGeofence: (geofence: Omit<Geofence, 'id' | 'createdAt'>) => void;
  removeGeofence: (id: string) => void;
  clearAlerts: () => void;
  dismissAlert: (id: string) => void;
  checkLocation: (trackerId: string, lat: number, lng: number) => void;
}

const GeofenceContext = createContext<GeofenceContextType | undefined>(undefined);

const GEOFENCE_STORAGE_KEY = 'geotracker_geofences';
const GEOFENCE_STATE_KEY = 'geotracker_geofence_states';

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

export function GeofenceProvider({ children }: { children: ReactNode }) {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [insideStates, setInsideStates] = useState<Record<string, boolean>>({});

  // Load geofences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GEOFENCE_STORAGE_KEY);
      if (saved) setGeofences(JSON.parse(saved));
      const states = localStorage.getItem(GEOFENCE_STATE_KEY);
      if (states) setInsideStates(JSON.parse(states));
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  // Persist geofences
  useEffect(() => {
    try {
      localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(geofences));
    } catch {
      // localStorage may be unavailable
    }
  }, [geofences]);

  // Persist inside states
  useEffect(() => {
    try {
      localStorage.setItem(GEOFENCE_STATE_KEY, JSON.stringify(insideStates));
    } catch {
      // localStorage may be unavailable
    }
  }, [insideStates]);

  const addGeofence = useCallback((geofence: Omit<Geofence, 'id' | 'createdAt'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? `gf_${crypto.randomUUID()}`
      : `gf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newGeofence: Geofence = {
      ...geofence,
      id,
      createdAt: new Date().toISOString(),
    };
    setGeofences((prev) => [...prev, newGeofence]);
  }, []);

  const removeGeofence = useCallback((id: string) => {
    setGeofences((prev) => prev.filter((g) => g.id !== id));
    setInsideStates((prev) => {
      const next = { ...prev };
      // Remove all states for this geofence
      Object.keys(next).forEach((key) => {
        if (key.startsWith(id + ':')) delete next[key];
      });
      return next;
    });
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const checkLocation = useCallback((trackerId: string, lat: number, lng: number) => {
    const relevantFences = geofences.filter((g) => g.trackerId === trackerId);

    for (const fence of relevantFences) {
      const distance = haversineDistance(lat, lng, fence.centerLat, fence.centerLng);
      const isInside = distance <= fence.radiusMeters;
      const stateKey = `${fence.id}:${trackerId}`;
      const wasInside = insideStates[stateKey];

      if (wasInside !== undefined && wasInside !== isInside) {
        const alertId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? `alert_${crypto.randomUUID()}`
          : `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const alert: GeofenceAlert = {
          id: alertId,
          geofenceId: fence.id,
          trackerId,
          type: isInside ? 'enter' : 'exit',
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
          geofenceName: fence.name,
        };
        setAlerts((prev) => [alert, ...prev].slice(0, 50));

        // Send browser notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const title = isInside ? '📍 Geofence Enter' : '📍 Geofence Exit';
          const body = `Tracker ${trackerId.substring(0, 15)}... ${isInside ? 'entered' : 'exited'} "${fence.name}"`;
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }

      setInsideStates((prev) => ({ ...prev, [stateKey]: isInside }));
    }
  }, [geofences, insideStates]);

  return (
    <GeofenceContext.Provider value={{
      geofences,
      alerts,
      addGeofence,
      removeGeofence,
      clearAlerts,
      dismissAlert,
      checkLocation,
    }}>
      {children}
    </GeofenceContext.Provider>
  );
}

export function useGeofence() {
  const context = useContext(GeofenceContext);
  if (!context) {
    throw new Error('useGeofence must be used within a GeofenceProvider');
  }
  return context;
}
