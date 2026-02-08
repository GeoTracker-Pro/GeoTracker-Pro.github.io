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
  Timestamp,
  serverTimestamp,
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

// === TRACKER OPERATIONS ===

// Get all trackers for a specific user
export async function getTrackersFromFirebase(userId?: string): Promise<Tracker[]> {
  try {
    const db = getFirebaseDb();
    const trackersRef = collection(db, TRACKERS_COLLECTION);
    let q;
    if (userId) {
      q = query(trackersRef, where('userId', '==', userId), orderBy('created', 'desc'));
    } else {
      q = query(trackersRef, orderBy('created', 'desc'));
    }
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Tracker',
        created: timestampToString(data.created),
        locations: data.locations || [],
        userId: data.userId || null,
      } as Tracker;
    });
  } catch (error) {
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
    if (!data.userId) {
    }
    return {
      id: snapshot.id,
      name: data.name || 'Unnamed Tracker',
      created: timestampToString(data.created),
      locations: data.locations || [],
      userId: data.userId || null,
    } as Tracker;
  } catch (error) {
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
    return null;
  }
}

// Add location to tracker (appends to locations array)
export async function addLocationToTrackerInFirebase(trackingId: string, location: LocationData): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    // First ensure the tracker exists
    const tracker = await getTrackerFromFirebase(trackingId);
    if (!tracker) {
      // Create the tracker if it doesn't exist
      await createTrackerInFirebase('Shared Tracker', trackingId);
    }
    
    const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);
    
    // Get current tracker to append to existing locations
    const currentTracker = await getTrackerFromFirebase(trackingId);
    const currentLocations = currentTracker?.locations || [];
    
    // Append new location to the beginning of the array (most recent first)
    await updateDoc(trackerRef, {
      locations: [location, ...currentLocations],
    });
    return true;
  } catch (error) {
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
    return false;
  }
}
