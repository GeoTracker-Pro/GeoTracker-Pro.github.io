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
  Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { DeviceInfo, LocationData, Tracker } from './storage';

// Collection names
const TRACKERS_COLLECTION = 'trackers';
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
  return validLocations;
}

// === TRACKER OPERATIONS ===

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
    
    const trackers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Tracker',
        created: timestampToString(data.created),
        locations: parseLocationsArray(data.locations),
        userId: data.userId || null,
      } as Tracker;
    });

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
    return {
      id: snapshot.id,
      name: data.name || 'Unnamed Tracker',
      created: timestampToString(data.created),
      locations: parseLocationsArray(data.locations),
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
      locations: [],
    };
    
    if (userId) {
      trackerData.userId = userId;
    }
    
    let docRef;
    if (customId) {
      // Use custom ID
      docRef = doc(db, TRACKERS_COLLECTION, customId);
      await setDoc(docRef, trackerData);
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
    return await createTrackerInFirebase(name, trackingId);
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error getting or creating tracker:', trackingId, error);
    }
    return null;
  }
}

// Add location to tracker (appends to locations array)
export async function addLocationToTrackerInFirebase(trackingId: string, location: LocationData): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    // First ensure the tracker exists
    let tracker = await getTrackerFromFirebase(trackingId);
    if (!tracker) {
      // Create the tracker if it doesn't exist
      const created = await createTrackerInFirebase('Shared Tracker', trackingId);
      if (!created) {
        return false;
      }
      tracker = created;
    }
    
    const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);
    
    // Get current locations to append
    const currentLocations = tracker.locations || [];
    
    // Append new location to the beginning of the array (most recent first)
    await updateDoc(trackerRef, {
      locations: [location, ...currentLocations],
    });
    return true;
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('Error adding location to tracker:', trackingId, error);
    }
    return false;
  }
}

// Delete a tracker
export async function deleteTrackerFromFirebase(trackingId: string): Promise<boolean> {
  try {
    const db = getFirebaseDb();
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

    return onSnapshot(
      q,
      (snapshot) => {
        const trackers = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Unnamed Tracker',
            created: timestampToString(data.created),
            locations: parseLocationsArray(data.locations),
            userId: data.userId || null,
          } as Tracker;
        });

        // Sort by created date descending (most recent first)
        trackers.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );

        onUpdate(trackers);
      },
      (error) => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('Real-time tracker subscription error:', error);
        }
        onError(error instanceof Error ? error : new Error('Subscription error'));
      }
    );
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
