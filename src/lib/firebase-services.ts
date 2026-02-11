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
  arrayUnion,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { DeviceInfo, LocationData, Tracker } from './storage';

// Check if user is currently authenticated
function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

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

// Helper to create tracker data object
function createTrackerData(name: string, userId?: string) {
  const data: Record<string, unknown> = {
    name: name || 'Unnamed Tracker',
    created: serverTimestamp(),
    updatedAt: serverTimestamp(),
    locations: [],
  };
  if (userId) {
    data.userId = userId;
  }
  return data;
}

// === TRACKER OPERATIONS ===

// Get all trackers for the current user
export async function getTrackersFromFirebase(): Promise<Tracker[]> {
  const user = auth.currentUser;
  if (!user) {
    console.warn('Skipping Firestore read: waiting for user authentication');
    return [];
  }
  try {
    const trackersRef = collection(db, TRACKERS_COLLECTION);
    const q = query(trackersRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    
    const trackers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Tracker',
        created: timestampToString(data.created),
        locations: data.locations || [],
      } as Tracker;
    });

    // Sort in JavaScript instead of Firestore to avoid requiring a composite index
    trackers.sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return dateB - dateA; // Newest first
    });

    return trackers;
  } catch (error) {
    console.error('Error getting trackers:', error);
    throw error;
  }
}

// Get a specific tracker by ID
export async function getTrackerFromFirebase(trackingId: string): Promise<Tracker | null> {
  try {
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
      locations: data.locations || [],
    } as Tracker;
  } catch (error) {
    console.error('Error getting tracker:', error);
    throw error;
  }
}

// Create a new tracker
export async function createTrackerInFirebase(name: string, customId?: string): Promise<Tracker | null> {
  const user = auth.currentUser;
  if (!user) {
    console.warn('Skipping Firestore write: user must be authenticated');
    return null;
  }
  try {
    const trackerData = createTrackerData(name, user.uid);
    
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
    };
  } catch (error) {
    console.error('Error creating tracker:', error);
    throw error;
  }
}

// Get or create a tracker
export async function getOrCreateTrackerInFirebase(trackingId: string, name: string = 'Shared Tracker'): Promise<Tracker | null> {
  try {
    const existing = await getTrackerFromFirebase(trackingId);
    if (existing) {
      return existing;
    }
    // Direct creation without auth check for shared tracker links
    await setDoc(doc(db, TRACKERS_COLLECTION, trackingId), createTrackerData(name));
    return {
      id: trackingId,
      name,
      created: new Date().toISOString(),
      locations: [],
    };
  } catch (error) {
    // If we get a permission error on read, the tracker likely exists but is owned by
    // an authenticated user. We can still attempt to add locations via update.
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
      // Return a minimal tracker object so location updates can proceed
      return {
        id: trackingId,
        name,
        created: new Date().toISOString(),
        locations: [],
      };
    }
    console.error('Error getting or creating tracker:', error);
    throw error;
  }
}

// Add location to a tracker
export async function addLocationToTrackerInFirebase(trackingId: string, location: LocationData): Promise<boolean> {
  // Sanitize location data to ensure all fields are defined (Firestore rejects undefined values)
  const sanitizedLocation: Record<string, unknown> = {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: location.timestamp,
  };

  if (location.deviceInfo) {
    sanitizedLocation.deviceInfo = {
      browser: location.deviceInfo.browser || 'Unknown',
      os: location.deviceInfo.os || 'Unknown',
      platform: location.deviceInfo.platform || 'Unknown',
      screen: location.deviceInfo.screen || 'Unknown',
      userAgent: location.deviceInfo.userAgent || 'Unknown',
    };
  }

  if (location.ip) {
    sanitizedLocation.ip = location.ip;
  }

  const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);

  try {
    // Try to update the existing tracker directly
    await updateDoc(trackerRef, {
      locations: arrayUnion(sanitizedLocation),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    // If the document doesn't exist, create it with the location data
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('No document to update') || errorMessage.includes('NOT_FOUND')) {
      try {
        const data = createTrackerData('Shared Tracker');
        data.locations = [sanitizedLocation];
        await setDoc(trackerRef, data);
        return true;
      } catch (createError) {
        console.error('Error creating tracker with location:', createError);
        throw createError;
      }
    }
    console.error('Error adding location:', error);
    throw error;
  }
}

// Delete a tracker
export async function deleteTrackerFromFirebase(trackingId: string): Promise<boolean> {
  if (!isAuthenticated()) {
    console.warn('Skipping Firestore delete: waiting for user authentication');
    return false;
  }
  try {
    const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);
    await deleteDoc(trackerRef);
    return true;
  } catch (error) {
    console.error('Error deleting tracker:', error);
    throw error;
  }
}

// === USER OPERATIONS ===

// Create or update user in Firestore
export async function createOrUpdateUser(userId: string, email: string, displayName?: string, photoURL?: string): Promise<User | null> {
  if (!isAuthenticated()) {
    console.warn('Skipping Firestore user update: waiting for user authentication');
    return null;
  }
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update last login
      const updateData: Record<string, unknown> = {
        lastLoginAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };
      if (displayName) updateData.displayName = displayName;
      if (photoURL) updateData.photoURL = photoURL;

      await updateDoc(userRef, updateData);
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
        photoURL: photoURL || '',
        createdAt: serverTimestamp(),
        lastLoginAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, userData);
      return {
        id: userId,
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return null;
  }
}

// Get all users
export async function getUsersFromFirebase(): Promise<User[]> {
  if (!isAuthenticated()) {
    console.warn('Skipping Firestore read: waiting for user authentication');
    return [];
  }
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        createdAt: timestampToString(data.createdAt),
        lastLoginAt: data.lastLoginAt ? timestampToString(data.lastLoginAt) : undefined,
      } as User;
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

// Get a specific user
export async function getUserFromFirebase(userId: string): Promise<User | null> {
  try {
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
      createdAt: timestampToString(data.createdAt),
      lastLoginAt: data.lastLoginAt ? timestampToString(data.lastLoginAt) : undefined,
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Delete a user
export async function deleteUserFromFirebase(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
