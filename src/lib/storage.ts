// Storage utility for client-side data persistence
// Uses Firebase Firestore as the primary backend with localStorage fallback

import {
  getTrackersFromFirebase,
  getTrackerFromFirebase,
  createTrackerInFirebase,
  getOrCreateTrackerInFirebase,
  addLocationToTrackerInFirebase,
  deleteTrackerFromFirebase,
} from './firebase-services';

export interface DeviceInfo {
  browser: string;
  os: string;
  platform: string;
  screen: string;
  userAgent: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  deviceInfo?: DeviceInfo;
  ip?: string;
}

export interface Tracker {
  id: string;
  name: string;
  created: string;
  locations: LocationData[];
  userId?: string | null;
}

const STORAGE_KEY = 'geotracker_data';

// Generate unique tracking ID using crypto for better randomness
export function generateTrackingId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return 'track_' + window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'track_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

// ==========================================
// Firebase-based async functions (primary)
// ==========================================

// Get all trackers from Firebase (filtered by userId if provided)
export async function getTrackersAsync(userId?: string): Promise<Tracker[]> {
  try {
    return await getTrackersFromFirebase(userId);
  } catch (error) {
    return getTrackers();
  }
}

// Get a specific tracker by ID from Firebase
export async function getTrackerAsync(trackingId: string): Promise<Tracker | null> {
  try {
    return await getTrackerFromFirebase(trackingId);
  } catch (error) {
    return getTracker(trackingId) || null;
  }
}

// Create a new tracker in Firebase
export async function createTrackerAsync(name: string, userId?: string): Promise<Tracker | null> {
  const trackerId = generateTrackingId();
  try {
    const tracker = await createTrackerInFirebase(name, trackerId, userId);
    return tracker;
  } catch (error) {
    return createTracker(name);
  }
}

// Get or create a tracker by ID in Firebase (for shared links)
export async function getOrCreateTrackerAsync(trackingId: string): Promise<Tracker | null> {
  try {
    return await getOrCreateTrackerInFirebase(trackingId);
  } catch (error) {
    return getOrCreateTracker(trackingId);
  }
}

// Add location to a tracker in Firebase
export async function addLocationToTrackerAsync(trackingId: string, location: LocationData): Promise<boolean> {
  try {
    return await addLocationToTrackerInFirebase(trackingId, location);
  } catch (error) {
    return addLocationToTracker(trackingId, location);
  }
}

// Delete a tracker from Firebase
export async function deleteTrackerAsync(trackingId: string): Promise<boolean> {
  try {
    return await deleteTrackerFromFirebase(trackingId);
  } catch (error) {
    return deleteTracker(trackingId);
  }
}

// ==========================================
// LocalStorage-based sync functions (fallback)
// ==========================================

// Get all trackers from localStorage
export function getTrackers(): Tracker[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save trackers to localStorage
export function saveTrackers(trackers: Tracker[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackers));
  } catch (error) {
  }
}

// Create a new tracker
export function createTracker(name: string): Tracker {
  const tracker: Tracker = {
    id: generateTrackingId(),
    name: name || 'Unnamed Tracker',
    created: new Date().toISOString(),
    locations: [],
  };

  const trackers = getTrackers();
  trackers.push(tracker);
  saveTrackers(trackers);

  return tracker;
}

// Create a tracker with a specific ID (for shared links)
export function createTrackerWithId(trackingId: string, name: string = 'Shared Tracker'): Tracker {
  const tracker: Tracker = {
    id: trackingId,
    name: name,
    created: new Date().toISOString(),
    locations: [],
  };

  const trackers = getTrackers();
  trackers.push(tracker);
  saveTrackers(trackers);

  return tracker;
}

// Get a specific tracker by ID
export function getTracker(trackingId: string): Tracker | undefined {
  const trackers = getTrackers();
  return trackers.find(t => t.id === trackingId);
}

// Get or create a tracker by ID (for shared links)
export function getOrCreateTracker(trackingId: string): Tracker {
  let tracker = getTracker(trackingId);
  if (!tracker) {
    tracker = createTrackerWithId(trackingId);
  }
  return tracker;
}

// Update the latest location for a tracker (replaces instead of appending)
export function addLocationToTracker(trackingId: string, location: LocationData): boolean {
  const trackers = getTrackers();
  const tracker = trackers.find(t => t.id === trackingId);

  if (tracker) {
    // Replace all locations with just the latest one
    tracker.locations = [location];
    saveTrackers(trackers);
    return true;
  }

  return false;
}

// Delete a tracker
export function deleteTracker(trackingId: string): boolean {
  const trackers = getTrackers();
  const index = trackers.findIndex(t => t.id === trackingId);

  if (index !== -1) {
    trackers.splice(index, 1);
    saveTrackers(trackers);
    return true;
  }

  return false;
}

// Get device info from browser
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      platform: 'Unknown',
      screen: 'Unknown',
      userAgent: 'Unknown',
    };
  }

  const userAgent = navigator.userAgent;

  // Detect browser - Check in order of specificity to avoid false positives
  let browser = 'Unknown';
  if (userAgent.indexOf('Firefox') > -1 && userAgent.indexOf('Seamonkey') === -1) {
    browser = 'Firefox';
  } else if (userAgent.indexOf('Edg') > -1) {
    // Modern Edge (Chromium-based)
    browser = 'Edge';
  } else if (userAgent.indexOf('OPR') > -1 || userAgent.indexOf('Opera') > -1) {
    browser = 'Opera';
  } else if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Safari') > -1) {
    // Chrome includes both "Chrome" and "Safari" in UA
    browser = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    // Safari only has "Safari" but not "Chrome"
    browser = 'Safari';
  } else if (userAgent.indexOf('Edge') > -1) {
    // Legacy Edge
    browser = 'Edge';
  }

  // Detect OS - Check more specific patterns first
  let os = 'Unknown';
  if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 || userAgent.indexOf('iPod') > -1) {
    os = 'iOS';
  } else if (userAgent.indexOf('Android') > -1) {
    os = 'Android';
  } else if (userAgent.indexOf('Win') > -1) {
    os = 'Windows';
  } else if (userAgent.indexOf('Mac') > -1) {
    os = 'MacOS';
  } else if (userAgent.indexOf('Linux') > -1) {
    os = 'Linux';
  }

  return {
    browser,
    os,
    platform: navigator.platform || 'Unknown',
    screen: `${window.screen.width} x ${window.screen.height}`,
    userAgent,
  };
}

// Get IP address (using free API)
export async function getIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unable to fetch';
  }
}

// Get current geolocation
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Use longer timeout and less aggressive settings for better mobile compatibility
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 30000, // Increased to 30 seconds for slower devices/networks
      maximumAge: 5000, // Allow cached position up to 5 seconds old
    });
  });
}

// Get geolocation error message
export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access denied. Please allow location permissions in your browser settings.';
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable.';
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'An unknown error occurred.';
  }
}
