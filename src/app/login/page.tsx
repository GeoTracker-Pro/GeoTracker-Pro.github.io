'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();

  const handleEnter = () => {
    localStorage.setItem('geotracker_authenticated', 'true');
    router.push('/dashboard');
  };

  return (
    <div className={styles.loginBg}>
      <div className={styles.container}>
        <div className={styles.logo}>📍</div>
        <h1>Welcome to GeoTracker</h1>
        <p className={styles.subtitle}>
          Browser-based location tracking application
        </p>

        <div className={styles.infoBox}>
          <p>📱 <strong>Static Version</strong></p>
          <p>This is the GitHub Pages deployment. Data is stored locally in your browser using localStorage.</p>
        </div>

        <button 
          onClick={handleEnter}
          className={`btn ${styles.loginBtn}`}
        >
          Enter Dashboard
        </button>
      </div>
    </div>
  );
}
