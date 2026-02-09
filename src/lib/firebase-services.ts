// Firebase Firestore services for GeoTracker
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { DeviceInfo, LocationData, Tracker } from './storage';

// Collection names
const TRACKERS_COLLECTION = 'trackers';
const LOCATIONS_SUBCOLLECTION = 'locations';
const USERS_COLLECTION = 'users';

// User interface
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

// Convert Firestore timestamp to ISO string
function timestampToString(timestamp: Timestamp | string | undefined): string {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  return timestamp.toDate().toISOString();
}

// Parse and validate location data from Firebase to ensure proper types
function parseLocationData(rawLocation: Record<string, unknown>): LocationData | null {
  if (!rawLocation || typeof rawLocation !== 'object') {
    return null;
  }

  // Parse numeric values, ensuring they're valid numbers
  const latitude = typeof rawLocation.latitude === 'number' 
    ? rawLocation.latitude 
    : parseFloat(String(rawLocation.latitude));
  const longitude = typeof rawLocation.longitude === 'number'
    ? rawLocation.longitude
    : parseFloat(String(rawLocation.longitude));
  const accuracy = typeof rawLocation.accuracy === 'number'
    ? rawLocation.accuracy
    : parseFloat(String(rawLocation.accuracy));

  // Validate that we have valid coordinates
  if (isNaN(latitude) || isNaN(longitude) || isNaN(accuracy)) {
    return null;
  }

  // Parse timestamp
  const timestamp = rawLocation.timestamp 
    ? (typeof rawLocation.timestamp === 'string' 
        ? rawLocation.timestamp 
        : timestampToString(rawLocation.timestamp as Timestamp))
    : new Date().toISOString();

  // Parse device info if available
  let deviceInfo: DeviceInfo | undefined;
  if (rawLocation.deviceInfo && typeof rawLocation.deviceInfo === 'object') {
    const di = rawLocation.deviceInfo as Record<string, unknown>;
    deviceInfo = {
      browser: String(di.browser || 'Unknown'),
      os: String(di.os || 'Unknown'),
      platform: String(di.platform || 'Unknown'),
      screen: String(di.screen || 'Unknown'),
      userAgent: String(di.userAgent || 'Unknown'),
    };
  }

  return {
    latitude,
    longitude,
    accuracy,
    timestamp,
    deviceInfo,
    ip: rawLocation.ip ? String(rawLocation.ip) : undefined,
  };
}

// Parse locations array from Firebase, filtering out invalid entries
function parseLocationsArray(rawLocations: unknown): LocationData[] {
  if (!Array.isArray(rawLocations)) {
    return [];
  }

  const validLocations: LocationData[] = [];
  for (const rawLoc of rawLocations) {
    const parsed = parseLocationData(rawLoc as Record<string, unknown>);
    if (parsed) {
      validLocations.push(parsed);
    }
  }

  // Sort by timestamp descending (most recent first) to ensure correct order
  // regardless of whether locations were prepended or appended
  const withTime = validLocations.map(loc => ({
    loc,
    time: new Date(loc.timestamp).getTime(),
  }));
  withTime.sort((a, b) => b.time - a.time);
  return withTime.map(({ loc }) => loc);
}

// === TRACKER OPERATIONS ===

// Fetch locations from the sub-collection for a single tracker
async function fetchLocationsForTracker(trackerId: string): Promise<LocationData[]> {
  const db = getFirebaseDb();
  const locationsRef = collection(db, TRACKERS_COLLECTION, trackerId, LOCATIONS_SUBCOLLECTION);
  try {
    const q = query(locationsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const locations: LocationData[] = [];
    for (const docSnap of snapshot.docs) {
      const parsed = parseLocationData(docSnap.data() as Record<string, unknown>);
      if (parsed) locations.push(parsed);
    }
    return locations;
  } catch {
    // If orderBy fails (missing index), fetch all and sort client-side
    const snapshot = await getDocs(locationsRef);
    const locations: LocationData[] = [];
    for (const docSnap of snapshot.docs) {
      const parsed = parseLocationData(docSnap.data() as Record<string, unknown>);
      if (parsed) locations.push(parsed);
    }
    locations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return locations;
  }
}

// Get all trackers for a specific user
export async function getTrackersFromFirebase(userId?: string): Promise<Tracker[]> {
  try {
    const db = getFirebaseDb();
    const trackersRef = collection(db, TRACKERS_COLLECTION);
    let snapshot;

    if (userId) {
      // Try compound query first; if it fails (e.g. missing composite index),
      // fall back to a simple filter without orderBy and sort client-side.
      try {
        const q = query(trackersRef, where('userId', '==', userId), orderBy('created', 'desc'));
        snapshot = await getDocs(q);
      } catch {
        const q = query(trackersRef, where('userId', '==', userId));
        snapshot = await getDocs(q);
      }
    } else {
      try {
        const q = query(trackersRef, orderBy('created', 'desc'));
        snapshot = await getDocs(q);
      } catch {
        snapshot = await getDocs(trackersRef);
      }
    }
    
    const trackers: Tracker[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Read locations from sub-collection, falling back to array field for
      // backward compatibility with trackers created before the migration.
      let locations = await fetchLocationsForTracker(docSnap.id);
      if (locations.length === 0 && Array.isArray(data.locations) && data.locations.length > 0) {
        locations = parseLocationsArray(data.locations);
      }
      trackers.push({
        id: docSnap.id,
        name: data.name || 'Unnamed Tracker',
        created: timestampToString(data.created),
        locations,
        userId: data.userId || null,
      });
    }

    // Sort by created date descending (client-side fallback for when orderBy is unavailable)
    trackers.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return trackers;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error loading trackers:', error);
    }
    return [];
  }
}

// Get a specific tracker by ID
export async function getTrackerFromFirebase(trackingId: string): Promise<Tracker | null> {
  try {
    const db = getFirebaseDb();
    const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);
    const snapshot = await getDoc(trackerRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.data();
    // Read locations from sub-collection, falling back to array field
    let locations = await fetchLocationsForTracker(trackingId);
    if (locations.length === 0 && Array.isArray(data.locations) && data.locations.length > 0) {
      locations = parseLocationsArray(data.locations);
    }
    return {
      id: snapshot.id,
      name: data.name || 'Unnamed Tracker',
      created: timestampToString(data.created),
      locations,
      userId: data.userId || null,
    } as Tracker;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error getting tracker:', trackingId, error);
    }
    return null;
  }
}

// Create a new tracker
export async function createTrackerInFirebase(name: string, customId?: string, userId?: string): Promise<Tracker | null> {
  try {
    const db = getFirebaseDb();
    const trackerData: Record<string, unknown> = {
      name: name || 'Unnamed Tracker',
      created: serverTimestamp(),
    };
    
    if (userId) {
      trackerData.userId = userId;
    }
    
    let docRef;
    if (customId) {
      // Use custom ID with merge to avoid overwriting fields (e.g. userId)
      // that may have been set by the dashboard before the track page races
      // to create the same document.
      docRef = doc(db, TRACKERS_COLLECTION, customId);
      await setDoc(docRef, trackerData, { merge: true });
    } else {
      // Auto-generate ID
      docRef = await addDoc(collection(db, TRACKERS_COLLECTION), trackerData);
    }
    
    return {
      id: customId || docRef.id,
      name: name || 'Unnamed Tracker',
      created: new Date().toISOString(),
      locations: [],
      userId: userId || null,
    };
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error creating tracker:', error);
    }
    return null;
  }
}

// Get or create a tracker
export async function getOrCreateTrackerInFirebase(trackingId: string, name: string = 'Shared Tracker'): Promise<Tracker | null> {
  try {
    const existing = await getTrackerFromFirebase(trackingId);
    if (existing) {
      return existing;
    }
    const created = await createTrackerInFirebase(name, trackingId);
    if (created) {
      return created;
    }
    // If createTrackerInFirebase returned null, the document may still have been
    // created (e.g. network hiccup after write). Try fetching it once more.
    const retryFetch = await getTrackerFromFirebase(trackingId);
    if (!retryFetch && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('getOrCreateTrackerInFirebase: creation and retry fetch both failed for:', trackingId);
    }
    return retryFetch;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error getting or creating tracker:', trackingId, error);
    }
    return null;
  }
}

// Sanitize an object for Firestore by removing undefined values
// Firestore does not accept undefined — only null or actual values
function sanitizeForFirestore(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? sanitizeForFirestore(item as Record<string, unknown>)
          : item
      );
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeForFirestore(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Add location to tracker using a Firestore sub-collection for reliable writes.
// Each location is stored as a separate document in the
// `trackers/{trackerId}/locations` sub-collection.  This avoids the 1 MiB
// document size limit and eliminates transaction conflicts that occurred when
// all locations were stored in a single array field.
export async function addLocationToTrackerInFirebase(trackingId: string, location: LocationData): Promise<boolean> {
  const db = getFirebaseDb();

  // Sanitize location data to remove undefined values (Firestore rejects undefined)
  const sanitizedLocation = sanitizeForFirestore({ ...location });

  try {
    // Ensure the parent tracker document exists.  Use merge so we don't
    // overwrite fields like name or userId that may already be set. Only set
    // the name for a brand-new document; the merge will leave the field
    // untouched if it already exists.
    const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);
    await setDoc(trackerRef, { name: 'Shared Tracker' }, { merge: true });

    // Add location as a new document in the sub-collection
    const locationsRef = collection(db, TRACKERS_COLLECTION, trackingId, LOCATIONS_SUBCOLLECTION);
    await addDoc(locationsRef, sanitizedLocation);
    return true;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('addLocationToTrackerInFirebase: write failed:', error);
    }
    throw error;
  }
}

// Delete a tracker and its locations sub-collection
export async function deleteTrackerFromFirebase(trackingId: string): Promise<boolean> {
  try {
    const db = getFirebaseDb();

    // Delete all location documents in the sub-collection first
    const locationsRef = collection(db, TRACKERS_COLLECTION, trackingId, LOCATIONS_SUBCOLLECTION);
    const locSnapshot = await getDocs(locationsRef);
    if (!locSnapshot.empty) {
      const batch = writeBatch(db);
      for (const locDoc of locSnapshot.docs) {
        batch.delete(locDoc.ref);
      }
      await batch.commit();
    }

    // Delete the tracker document
    const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);
    await deleteDoc(trackerRef);
    return true;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error deleting tracker:', trackingId, error);
    }
    return false;
  }
}

// === USER OPERATIONS ===

// Create or update user in Firestore
export async function createOrUpdateUser(userId: string, email: string, displayName?: string): Promise<User | null> {
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
        displayName: displayName || userDoc.data().displayName,
      });
      const data = userDoc.data();
      return {
        id: userId,
        email: data.email,
        displayName: displayName || data.displayName,
        createdAt: data.createdAt,
        lastLoginAt: new Date().toISOString(),
      };
    } else {
      // Create new user
      const userData = {
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(userRef, userData);
      return {
        id: userId,
        ...userData,
      };
    }
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error creating/updating user:', userId, error);
    }
    return null;
  }
}

// Get all users
export async function getUsersFromFirebase(): Promise<User[]> {
  try {
    const db = getFirebaseDb();
    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
      } as User;
    });
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error loading users:', error);
    }
    return [];
  }
}

// Get a specific user
export async function getUserFromFirebase(userId: string): Promise<User | null> {
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snapshot = await getDoc(userRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.data();
    return {
      id: snapshot.id,
      email: data.email,
      displayName: data.displayName,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt,
    } as User;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error getting user:', userId, error);
    }
    return null;
  }
}

// Delete a user
export async function deleteUserFromFirebase(userId: string): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error deleting user:', userId, error);
    }
    return false;
  }
}

// === REAL-TIME LISTENERS ===

// Subscribe to real-time tracker updates for a user (or all trackers for admin)
// Sets up a listener on the trackers collection and individual listeners on
// each tracker's locations sub-collection so the dashboard updates immediately
// when a new location arrives.
export function subscribeToTrackers(
  onUpdate: (trackers: Tracker[]) => void,
  onError: (error: Error) => void,
  userId?: string
): Unsubscribe {
  try {
    const db = getFirebaseDb();
    const trackersRef = collection(db, TRACKERS_COLLECTION);

    let q;
    if (userId) {
      q = query(trackersRef, where('userId', '==', userId));
    } else {
      q = query(trackersRef);
    }

    // Keep track of per-tracker location listeners and their latest data
    const locationUnsubscribes = new Map<string, Unsubscribe>();
    const trackerLocations = new Map<string, LocationData[]>();
    const trackerMeta = new Map<string, { name: string; created: string; userId: string | null }>();

    function emitUpdate() {
      const trackers: Tracker[] = [];
      for (const [id, meta] of trackerMeta.entries()) {
        trackers.push({
          id,
          name: meta.name,
          created: meta.created,
          locations: trackerLocations.get(id) || [],
          userId: meta.userId,
        });
      }
      trackers.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      onUpdate(trackers);
    }

    const trackersUnsub = onSnapshot(
      q,
      (snapshot) => {
        const currentIds = new Set<string>();

        for (const docSnap of snapshot.docs) {
          const id = docSnap.id;
          currentIds.add(id);
          const data = docSnap.data();
          trackerMeta.set(id, {
            name: data.name || 'Unnamed Tracker',
            created: timestampToString(data.created),
            userId: data.userId || null,
          });

          // Set up a sub-collection listener if we don't have one already
          if (!locationUnsubscribes.has(id)) {
            const locRef = collection(db, TRACKERS_COLLECTION, id, LOCATIONS_SUBCOLLECTION);
            const unsub = onSnapshot(
              locRef,
              (locSnapshot) => {
                const locations: LocationData[] = [];
                for (const locDoc of locSnapshot.docs) {
                  const parsed = parseLocationData(locDoc.data() as Record<string, unknown>);
                  if (parsed) locations.push(parsed);
                }
                locations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                // Fall back to array field for backward compatibility when
                // the sub-collection is empty but the parent doc has data.
                if (locations.length === 0) {
                  getDoc(doc(db, TRACKERS_COLLECTION, id)).then(parentSnap => {
                    const parentData = parentSnap.data();
                    if (parentData && Array.isArray(parentData.locations) && parentData.locations.length > 0) {
                      trackerLocations.set(id, parseLocationsArray(parentData.locations));
                      emitUpdate();
                    }
                  }).catch(() => { /* ignore */ });
                }

                trackerLocations.set(id, locations);
                emitUpdate();
              },
              () => {
                // On error, try reading the parent document's locations array
                // as a fallback
                getDoc(doc(db, TRACKERS_COLLECTION, id)).then(parentSnap => {
                  const parentData = parentSnap.data();
                  if (parentData && Array.isArray(parentData.locations) && parentData.locations.length > 0) {
                    trackerLocations.set(id, parseLocationsArray(parentData.locations));
                  }
                  emitUpdate();
                }).catch(() => {
                  emitUpdate();
                });
              }
            );
            locationUnsubscribes.set(id, unsub);
          }
        }

        // Clean up listeners for removed trackers
        for (const [id, unsub] of locationUnsubscribes.entries()) {
          if (!currentIds.has(id)) {
            unsub();
            locationUnsubscribes.delete(id);
            trackerLocations.delete(id);
            trackerMeta.delete(id);
          }
        }

        emitUpdate();
      },
      (error) => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('Real-time tracker subscription error:', error);
        }
        onError(error instanceof Error ? error : new Error('Subscription error'));
      }
    );

    // Return cleanup function that tears down all listeners
    return () => {
      trackersUnsub();
      for (const unsub of locationUnsubscribes.values()) {
        unsub();
      }
      locationUnsubscribes.clear();
      trackerLocations.clear();
      trackerMeta.clear();
    };
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error setting up tracker subscription:', error);
    }
    onError(error instanceof Error ? error : new Error('Failed to subscribe'));
    // Return a no-op unsubscribe function
    return () => {};
  }
}

// Re-export Unsubscribe type for consumers
export type { Unsubscribe };
