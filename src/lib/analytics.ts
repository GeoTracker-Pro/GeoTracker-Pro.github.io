import type { LocationData } from '@/lib/storage';

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine formula — returns distance in meters between two coordinates. */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/** Total distance traveled across all locations in meters. */
export function calculateTotalDistance(locations: LocationData[]): number {
  if (locations.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < locations.length; i++) {
    total += calculateDistance(
      locations[i - 1].latitude,
      locations[i - 1].longitude,
      locations[i].latitude,
      locations[i].longitude
    );
  }
  return total;
}

/** Speed between two consecutive points in km/h. */
export function calculateSpeed(
  loc1: LocationData,
  loc2: LocationData
): number {
  const dist = calculateDistance(
    loc1.latitude,
    loc1.longitude,
    loc2.latitude,
    loc2.longitude
  );
  const t1 = new Date(loc1.timestamp).getTime();
  const t2 = new Date(loc2.timestamp).getTime();
  const timeDiffS = Math.abs(t2 - t1) / 1000;
  if (timeDiffS === 0) return 0;
  return (dist / timeDiffS) * 3.6; // m/s → km/h
}

/** Average speed across all consecutive location pairs in km/h. */
export function calculateAverageSpeed(locations: LocationData[]): number {
  if (locations.length < 2) return 0;
  const totalDist = calculateTotalDistance(locations);
  const t1 = new Date(locations[0].timestamp).getTime();
  const t2 = new Date(locations[locations.length - 1].timestamp).getTime();
  const timeDiffS = Math.abs(t2 - t1) / 1000;
  if (timeDiffS === 0) return 0;
  return (totalDist / timeDiffS) * 3.6;
}

/** Maximum speed between any two consecutive points in km/h. */
export function calculateMaxSpeed(locations: LocationData[]): number {
  if (locations.length < 2) return 0;
  let max = 0;
  for (let i = 1; i < locations.length; i++) {
    const speed = calculateSpeed(locations[i - 1], locations[i]);
    if (speed > max) max = speed;
  }
  return max;
}

/** Total time tracking was active in milliseconds. */
export function getTimeSpent(locations: LocationData[]): number {
  if (locations.length < 2) return 0;
  const timestamps = locations.map((l) => new Date(l.timestamp).getTime());
  return Math.max(...timestamps) - Math.min(...timestamps);
}

export interface DwellTime {
  latitude: number;
  longitude: number;
  durationMs: number;
  count: number;
}

/**
 * Calculate dwell time at clusters of consecutive points within thresholdMeters.
 * Each cluster groups consecutive locations that fall within thresholdMeters of
 * the cluster's first point. Returns the centroid, total duration, and point count.
 */
export function getDwellTimes(
  locations: LocationData[],
  thresholdMeters: number
): DwellTime[] {
  if (locations.length === 0) return [];

  const clusters: DwellTime[] = [];
  let clusterStart = 0;

  for (let i = 1; i <= locations.length; i++) {
    const inCluster =
      i < locations.length &&
      calculateDistance(
        locations[clusterStart].latitude,
        locations[clusterStart].longitude,
        locations[i].latitude,
        locations[i].longitude
      ) <= thresholdMeters;

    if (!inCluster) {
      const t0 = new Date(locations[clusterStart].timestamp).getTime();
      const tEnd = new Date(locations[i - 1].timestamp).getTime();
      clusters.push({
        latitude: locations[clusterStart].latitude,
        longitude: locations[clusterStart].longitude,
        durationMs: tEnd - t0,
        count: i - clusterStart,
      });
      clusterStart = i;
    }
  }
  return clusters;
}

/** Group locations by hour of day (0-23). */
export function getLocationsByHour(
  locations: LocationData[]
): Record<number, LocationData[]> {
  const result: Record<number, LocationData[]> = {};
  for (let h = 0; h < 24; h++) result[h] = [];
  for (const loc of locations) {
    const hour = new Date(loc.timestamp).getHours();
    result[hour].push(loc);
  }
  return result;
}

/** Group locations by calendar day (YYYY-MM-DD). */
export function getLocationsByDay(
  locations: LocationData[]
): Record<string, LocationData[]> {
  const result: Record<string, LocationData[]> = {};
  for (const loc of locations) {
    const d = new Date(loc.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!result[key]) result[key] = [];
    result[key].push(loc);
  }
  return result;
}
