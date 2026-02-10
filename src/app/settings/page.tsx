'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { getSettings, saveSettings, DEFAULT_SETTINGS, UserSettings } from '@/lib/settings';
import styles from './page.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      setSettings(getSettings());
    }
  }, [router, user, authLoading]);

  const showMessage = (message: string, error = false) => {
    setStatusMessage(message);
    setIsError(error);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleSave = () => {
    try {
      saveSettings(settings);
      showMessage('Settings saved successfully');
    } catch {
      showMessage('Failed to save settings', true);
    }
  };

  if (authLoading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>⚙️ Settings</h1>
            <p className={styles.subtitle}>System configuration module</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/dashboard" className={styles.navLink}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`${styles.statusMessage} ${isError ? styles.statusError : styles.statusSuccess}`}>
          {statusMessage}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.profileSection}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className={styles.profileDetails}>
              <h3>{user.displayName || 'Anonymous User'}</h3>
              <p>{user.email || 'No email'}</p>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Preferences</h2>

        <div className={styles.formGroup}>
          <label htmlFor="updateInterval">Update Frequency</label>
          <select
            id="updateInterval"
            className={styles.select}
            value={settings.updateInterval}
            onChange={(e) => setSettings({ ...settings, updateInterval: Number(e.target.value) })}
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Accuracy Mode</label>
          <div className={styles.radioGroup}>
            {(['high', 'balanced', 'low'] as const).map((mode) => (
              <label
                key={mode}
                className={`${styles.radioLabel} ${settings.accuracyMode === mode ? styles.radioLabelActive : ''}`}
              >
                <input
                  type="radio"
                  name="accuracyMode"
                  value={mode}
                  checked={settings.accuracyMode === mode}
                  onChange={(e) => setSettings({ ...settings, accuracyMode: e.target.value as UserSettings['accuracyMode'] })}
                />
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Theme Selection</label>
          <div className={styles.themeToggle}>
            <button onClick={toggleTheme} className={styles.themeToggleBtn} type="button">
              {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
            </button>
            <span className={styles.themeLabel}>Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="dataRetention">Data Retention</label>
          <select
            id="dataRetention"
            className={styles.select}
            value={settings.dataRetention}
            onChange={(e) => setSettings({ ...settings, dataRetention: e.target.value as UserSettings['dataRetention'] })}
          >
            <option value="never">Never (keep forever)</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="mapProvider">Map Provider</label>
          <select
            id="mapProvider"
            className={styles.select}
            value={settings.mapProvider}
            onChange={(e) => setSettings({ ...settings, mapProvider: e.target.value as UserSettings['mapProvider'] })}
          >
            <option value="google">Google Maps</option>
            <option value="osm">OpenStreetMap</option>
          </select>
        </div>

        <button onClick={handleSave} className={styles.saveBtn} type="button">
          💾 Save Settings
        </button>
      </div>
    </div>
  );
}
