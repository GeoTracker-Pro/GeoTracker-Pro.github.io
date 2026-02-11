// Storage utility for client-side data persistence
// Uses localStorage for GitHub Pages compatibility (no backend needed)

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
    console.error('Error saving trackers to localStorage:', error);
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

// Add location to a tracker
export function addLocationToTracker(trackingId: string, location: LocationData): boolean {
  const trackers = getTrackers();
  const tracker = trackers.find(t => t.id === trackingId);

  if (tracker) {
    tracker.locations.push(location);
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

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Safari';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
  }

  // Detect OS
  let os = 'Unknown';
  if (userAgent.indexOf('Win') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) os = 'Android';
  else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1) os = 'iOS';

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

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
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
