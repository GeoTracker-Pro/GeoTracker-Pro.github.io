'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, signUp, signInAsGuest, error: authError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInAsGuest();
      router.push('/dashboard');
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginBg}>
      <button
        onClick={toggleTheme}
        className={styles.themeToggleBtn}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className={styles.container}>
        <div className={styles.logo}>🎯</div>
        <h1>Cyber Tracker</h1>
        <p className={styles.subtitle}>
          Advanced geolocation surveillance system
        </p>

        <div className={styles.infoBox}>
          <p>🔐 <strong>Firebase Secured</strong></p>
          <p>All tracking data is stored securely in the cloud with real-time sync.</p>
        </div>

        {(error || authError) && (
          <div className={styles.errorBox}>
            ⚠️ {error || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && (
            <div className={styles.inputGroup}>
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Agent Codename"
                className={styles.input}
              />
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@command.center"
              required
              className={styles.input}
              aria-label="Email address"
              autoComplete="email"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={styles.input}
              aria-label="Password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          <button 
            type="submit"
            className={`btn ${styles.loginBtn}`}
            disabled={loading}
            aria-label={isSignUp ? 'Create new account' : 'Sign in to account'}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Access Command Center')}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button 
          onClick={handleGuestAccess}
          className={`btn ${styles.guestBtn}`}
          disabled={loading}
          aria-label="Continue as guest user"
        >
          👤 Continue as Guest
        </button>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className={styles.toggleBtn}
          aria-label={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
