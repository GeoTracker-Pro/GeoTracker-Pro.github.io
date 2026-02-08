// Firebase configuration and initialization
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// These values must be provided via environment variables
// See .env.local.example for setup instructions
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('❌ Firebase configuration error: Missing required fields:', missingFields.join(', '));
    }
    return false;
  }
  
  return true;
}

// Lazy initialization - Firebase is only initialized when first accessed
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let initialized = false;
let initError: Error | undefined;

function initializeFirebase() {
  // Skip if already attempted initialization
  if (initialized) {
    if (initError) {
      throw initError;
    }
    return;
  }

  initialized = true;

  try {
    if (!validateFirebaseConfig()) {
      initError = new Error('Invalid Firebase configuration. Please check your environment variables.');
      throw initError;
    }
    
    // Initialize Firebase (singleton pattern to prevent multiple initializations)
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Firebase initialized successfully
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('✅ Firebase initialized successfully');
      console.log('📱 Project ID:', firebaseConfig.projectId);
    }
  } catch (error) {
    initError = error instanceof Error ? error : new Error('Unknown Firebase initialization error');
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('❌ Firebase initialization error:', error);
      console.error('🔧 FIREBASE SETUP REQUIRED:');
      console.error('Please ensure Firebase Authentication is enabled in your Firebase Console');
    }
    throw initError;
  }
}

// Getters that perform lazy initialization
export function getFirebaseDb(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  if (!db) {
    throw new Error('Firebase Firestore is not available');
  }
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  if (!auth) {
    throw new Error('Firebase Auth is not available');
  }
  return auth;
}

export function getFirebaseApp(): FirebaseApp | undefined {
  if (!app) {
    try {
      initializeFirebase();
    } catch (e) {
      // Return undefined if initialization fails
      return undefined;
    }
  }
  return app;
}

// Export the getter function as default (lazy initialization)
export default getFirebaseApp;
