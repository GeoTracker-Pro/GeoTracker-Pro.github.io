'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { createOrUpdateUser } from './firebase-services';
import { getFirebaseErrorMessage } from './firebase-errors';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      
      // Set session persistence - user stays signed in until browser window is closed
      setPersistence(auth, browserSessionPersistence).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error setting auth persistence:', err);
        }
      });

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      }, (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth state change error:', error);
        }
        setError(getFirebaseErrorMessage(error));
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth initialization error:', error);
      }
      setError(getFirebaseErrorMessage(error));
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const auth = getFirebaseAuth();
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Update user record in Firestore
      await createOrUpdateUser(result.user.uid, email, result.user.displayName || undefined);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const auth = getFirebaseAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Create user record in Firestore
      await createOrUpdateUser(result.user.uid, email, displayName);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const signInAsGuest = async () => {
    try {
      setError(null);
      const auth = getFirebaseAuth();
      const result = await signInAnonymously(auth);
      // Create anonymous user record with UID-based identifier
      const guestEmail = `guest_${result.user.uid}@anonymous.local`;
      await createOrUpdateUser(result.user.uid, guestEmail, 'Guest User');
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInAsGuest, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
