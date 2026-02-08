// Firebase configuration and initialization
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// These values must be provided via environment variables.
// See .env.local.example for setup instructions.
function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
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
  // Skip if already successfully initialized
  if (initialized && !initError) {
    return;
  }

  // Reset error state to allow retry
  initError = undefined;
  initialized = true;

  try {
    const config = getFirebaseConfig();
    const validation = validateFirebaseConfig(config);
    
    if (!validation.valid) {
      initError = new Error(
        `Firebase configuration is missing required fields: ${validation.missingFields.join(', ')}. ` +
        'Please copy .env.local.example to .env.local and fill in your Firebase project configuration. ' +
        'See FIREBASE_SETUP.md for detailed instructions.'
      );
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
