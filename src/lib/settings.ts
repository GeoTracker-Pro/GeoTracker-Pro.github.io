export interface UserSettings {
  updateInterval: number;
  accuracyMode: 'high' | 'balanced' | 'low';
  dataRetention: 'never' | '7' | '30' | '90';
  mapProvider: 'google' | 'osm';
}

export const DEFAULT_SETTINGS: UserSettings = {
  updateInterval: 15,
  accuracyMode: 'balanced',
  dataRetention: 'never',
  mapProvider: 'osm',
};

const STORAGE_KEY = 'geotracker_settings';

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      delete parsed.__proto__;
      delete parsed.constructor;
      delete parsed.prototype;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return { ...DEFAULT_SETTINGS };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
