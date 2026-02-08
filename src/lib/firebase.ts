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
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Firebase configuration error: Missing required fields:', missingFields.join(', '));
    }
    return false;
  }
  
  return true;
}

// Initialize Firebase with error handling
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  if (!validateFirebaseConfig()) {
    throw new Error('Invalid Firebase configuration');
  }
  
  // Initialize Firebase (singleton pattern to prevent multiple initializations)
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  // Initialize Firestore
  db = getFirestore(app);
  
  // Initialize Auth
  auth = getAuth(app);
  
  // Firebase initialized successfully
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Firebase initialized successfully');
    console.log('📱 Project ID:', firebaseConfig.projectId);
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Firebase initialization error:', error);
    console.error('🔧 FIREBASE SETUP REQUIRED:');
    console.error('Please ensure Firebase Authentication is enabled in your Firebase Console');
  }
  
  throw new Error(`Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export { db, auth };
export default app;
