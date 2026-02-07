// Shared Firebase error message utility
// This provides consistent error messages across the application

import { AuthError } from 'firebase/auth';

/**
 * Converts Firebase auth error codes to user-friendly messages
 * @param error - The error object from Firebase auth
 * @returns A user-friendly error message
 */
export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof Error && 'code' in error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case 'auth/configuration-not-found':
        return '⚠️ Firebase Authentication is not properly configured. Please enable Authentication in Firebase Console and enable Email/Password and Anonymous sign-in methods.';
      case 'auth/operation-not-allowed':
        return '⚠️ This sign-in method is not enabled. Please enable Email/Password or Anonymous authentication in Firebase Console.';
      case 'auth/invalid-api-key':
        return '⚠️ Invalid Firebase API key. Please check your Firebase configuration.';
      case 'auth/app-not-authorized':
        return '⚠️ This app is not authorized to use Firebase Authentication. Please check your Firebase project settings.';
      case 'auth/network-request-failed':
        return '⚠️ Network error. Please check your internet connection and try again.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return authError.message || 'Authentication failed. Please try again.';
    }
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
}
