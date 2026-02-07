'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsInit, setNeedsInit] = useState(false);
  const [checkingInit, setCheckingInit] = useState(true);

  useEffect(() => {
    // Check if system needs initialization
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      const res = await fetch('/api/auth/init');
      const data = await res.json();
      setNeedsInit(!data.initialized);
    } catch (err) {
      console.error('Init check failed:', err);
    } finally {
      setCheckingInit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (needsInit) {
        // Create initial admin user
        const res = await fetch('/api/auth/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to create admin user');
        }

        // Now login
        setNeedsInit(false);
      }

      // Login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage as backup
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingInit) {
    return (
      <div className={styles.loginBg}>
        <div className={styles.container}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginBg}>
      <div className={styles.container}>
        <div className={styles.logo}>📍</div>
        <h1>{needsInit ? 'Setup GeoTracker' : 'GeoTracker Login'}</h1>
        <p className={styles.subtitle}>
          {needsInit 
            ? 'Create your admin account to get started' 
            : 'Sign in to access your dashboard'}
        </p>

        {error && (
          <div className={`status error`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {needsInit && (
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          <button 
            type="submit" 
            className={`btn ${styles.loginBtn}`}
            disabled={loading}
          >
            {loading ? 'Please wait...' : needsInit ? 'Create Admin Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
