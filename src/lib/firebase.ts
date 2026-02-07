// Firebase configuration and initialization
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// These values are safe to expose in client-side code as Firebase security rules protect the data
// They can be overridden using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDIHDGN0nAx1CpLCurSQj3TYlR1AwZmu6g",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "geotracker-865d3.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "geotracker-865d3",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "geotracker-865d3.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "881736898997",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:881736898997:web:038371eeb1f9e1a54ce1fc",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-TTHVMZNDX4"
};

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Firebase configuration error: Missing required fields:', missingFields.join(', '));
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
  
  console.log('✅ Firebase initialized successfully');
  console.log('📱 Project ID:', firebaseConfig.projectId);
  console.log('🔐 Auth Domain:', firebaseConfig.authDomain);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('');
  console.error('🔧 FIREBASE SETUP REQUIRED:');
  console.error('Please ensure Firebase Authentication is enabled in your Firebase Console:');
  console.error(`1. Visit: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication`);
  console.error('2. Click "Get Started" if Authentication is not enabled');
  console.error('3. Enable "Email/Password" sign-in method');
  console.error('4. Enable "Anonymous" sign-in method');
  console.error('');
  console.error('📚 For more details, see: https://firebase.google.com/docs/auth/web/start');
  console.error('');
  
  throw new Error(`Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export { db, auth };
export default app;
