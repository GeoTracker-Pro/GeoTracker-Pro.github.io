export interface GeocodingResult {
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  road?: string;
  postcode?: string;
}

// Cache results to avoid hitting rate limits
const geocodeCache = new Map<string, GeocodingResult>();

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'GeoTracker/2.0 (https://github.com/GeoTracker)' } }
    );
    if (!response.ok) return null;
    const data = await response.json();

    const result: GeocodingResult = {
      displayName: data.display_name || 'Unknown location',
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      road: data.address?.road,
      postcode: data.address?.postcode,
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
