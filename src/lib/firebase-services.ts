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
  orderBy,
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
    const q = query(trackersRef, where('userId', '==', user.uid), orderBy('created', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Tracker',
        created: timestampToString(data.created),
        locations: data.locations || [],
      } as Tracker;
    });
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
    console.error('Error getting or creating tracker:', error);
    throw error;
  }
}

// Add location to a tracker
export async function addLocationToTrackerInFirebase(trackingId: string, location: LocationData): Promise<boolean> {
  try {
    // First ensure the tracker exists
    const tracker = await getTrackerFromFirebase(trackingId);
    if (!tracker) {
      // Create the tracker if it doesn't exist
      await setDoc(doc(db, TRACKERS_COLLECTION, trackingId), createTrackerData('Shared Tracker'));
    }
    
    const trackerRef = doc(db, TRACKERS_COLLECTION, trackingId);
    await updateDoc(trackerRef, {
      locations: arrayUnion(location),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
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
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
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
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt,
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
