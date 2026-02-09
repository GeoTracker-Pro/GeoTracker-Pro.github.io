// Firebase configuration and initialization
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Shared setup instructions message
export const FIREBASE_SETUP_MESSAGE =
  'Firebase is not configured. Please set up your environment variables. ' +
  'Copy .env.local.example to .env.local and fill in your Firebase project configuration. ' +
  'See FIREBASE_SETUP.md for detailed instructions.';

// Firebase configuration
// These values can be provided via environment variables or use the defaults below.
// The default configuration is for the geotrackerpro-e3149 Firebase project.
// 
// SECURITY NOTE: Firebase client credentials (API keys, project IDs) are designed 
// to be public and safe to include in client-side code. They are not secrets.
// Security is enforced through:
//   - Firestore security rules (configured in Firebase Console)
//   - Firebase Authentication settings
//   - Domain restrictions (optional, configured in Google Cloud Console)
// 
// Reference: https://firebase.google.com/docs/projects/api-keys
// See FIREBASE_SETUP.md for detailed security information and setup instructions.
//
// To use a custom Firebase project, set environment variables in .env.local
function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyALuk1ujZBLTWMCJJ6ebT9DdH9CtYwVJ6I",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "geotrackerpro-e3149.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "geotrackerpro-e3149",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "geotrackerpro-e3149.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "948578635618",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:948578635618:web:803ddf06141f602dd7a63b",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-23B0643XX7"
  };
}

// Check if Firebase configuration is available
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
  return requiredFields.every(field => !!config[field]);
}

// Validate Firebase configuration
function validateFirebaseConfig(config: ReturnType<typeof getFirebaseConfig>) {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('❌ Firebase configuration error: Missing required fields:', missingFields.join(', '));
      console.error('🔧 To fix this:');
      console.error('   1. Copy .env.local.example to .env.local');
      console.error('   2. Fill in your Firebase project configuration values');
      console.error('   3. Restart the development server');
    }
    return { valid: false, missingFields };
  }
  
  return { valid: true, missingFields: [] };
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
    const config = getFirebaseConfig();
    const validation = validateFirebaseConfig(config);
    
    if (!validation.valid) {
      initError = new Error(FIREBASE_SETUP_MESSAGE);
      throw initError;
    }
    
    // Initialize Firebase (singleton pattern to prevent multiple initializations)
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Firebase initialized successfully
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('✅ Firebase initialized successfully');
      console.log('📱 Project ID:', config.projectId);
    }
  } catch (error) {
    initError = error instanceof Error ? error : new Error('Unknown Firebase initialization error');
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('❌ Firebase initialization error:', error);
      console.error('🔧 FIREBASE SETUP REQUIRED:');
      console.error('   1. Copy .env.local.example to .env.local');
      console.error('   2. Fill in your Firebase project configuration values');
      console.error('   3. Enable Authentication in Firebase Console');
      console.error('   4. Restart the development server');
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
