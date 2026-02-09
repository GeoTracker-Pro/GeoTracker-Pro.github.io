import { calculateDistance } from '@/lib/analytics';

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  type: 'circle';
  createdAt: string;
  trackerId?: string;
  alerts: {
    onEntry: boolean;
    onExit: boolean;
  };
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  geofenceName: string;
  type: 'entry' | 'exit';
  timestamp: string;
  latitude: number;
  longitude: number;
  trackerId?: string;
}

const GEOFENCES_KEY = 'geotracker_geofences';
const EVENTS_KEY = 'geotracker_geofence_events';
const LAST_STATE_KEY = 'geotracker_geofence_last_state';

export function getGeofences(): Geofence[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(GEOFENCES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveGeofence(geofence: Geofence): void {
  const geofences = getGeofences();
  const index = geofences.findIndex((g) => g.id === geofence.id);
  if (index >= 0) {
    geofences[index] = geofence;
  } else {
    geofences.push(geofence);
  }
  localStorage.setItem(GEOFENCES_KEY, JSON.stringify(geofences));
}

export function deleteGeofence(id: string): void {
  const geofences = getGeofences().filter((g) => g.id !== id);
  localStorage.setItem(GEOFENCES_KEY, JSON.stringify(geofences));
}

export function isInsideGeofence(lat: number, lng: number, geofence: Geofence): boolean {
  const distance = calculateDistance(lat, lng, geofence.latitude, geofence.longitude);
  return distance <= geofence.radius;
}

function getLastState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(LAST_STATE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setLastState(state: Record<string, boolean>): void {
  localStorage.setItem(LAST_STATE_KEY, JSON.stringify(state));
}

export function checkGeofences(
  lat: number,
  lng: number,
  trackerId?: string
): GeofenceEvent[] {
  const geofences = getGeofences();
  const lastState = getLastState();
  const events: GeofenceEvent[] = [];
  const newState: Record<string, boolean> = {};

  for (const geofence of geofences) {
    if (geofence.trackerId && trackerId && geofence.trackerId !== trackerId) {
      continue;
    }

    const inside = isInsideGeofence(lat, lng, geofence);
    const stateKey = `${geofence.id}_${trackerId ?? 'default'}`;
    const wasInside = lastState[stateKey];
    newState[stateKey] = inside;

    if (inside && !wasInside && geofence.alerts.onEntry) {
      const event: GeofenceEvent = {
        id: crypto.randomUUID(),
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        type: 'entry',
        timestamp: new Date().toISOString(),
        latitude: lat,
        longitude: lng,
        trackerId,
      };
      events.push(event);
      addGeofenceEvent(event);
    } else if (!inside && wasInside && geofence.alerts.onExit) {
      const event: GeofenceEvent = {
        id: crypto.randomUUID(),
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        type: 'exit',
        timestamp: new Date().toISOString(),
        latitude: lat,
        longitude: lng,
        trackerId,
      };
      events.push(event);
      addGeofenceEvent(event);
    }
  }

  setLastState({ ...lastState, ...newState });
  return events;
}

export function getGeofenceEvents(): GeofenceEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addGeofenceEvent(event: GeofenceEvent): void {
  const events = getGeofenceEvents();
  events.push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function clearGeofenceEvents(): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify([]));
}
