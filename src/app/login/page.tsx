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
        <div className={styles.logo}>🎯</div>
        <h1>Cyber Tracker</h1>
        <p className={styles.subtitle}>
          Advanced geolocation surveillance system
        </p>

        <div className={styles.infoBox}>
          <p>🔐 <strong>Secure Mode Active</strong></p>
          <p>All tracking data is encrypted and stored locally in your browser. No external servers involved.</p>
        </div>

        <button 
          onClick={handleEnter}
          className={`btn ${styles.loginBtn}`}
        >
          Access Command Center
        </button>
      </div>
    </div>
  );
}
