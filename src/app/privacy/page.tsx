import Link from 'next/link';
import styles from './page.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.container}>
        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: January 2025</p>

        <h2>1. Information We Collect</h2>
        <p>GeoTracker collects the following data when you use our service:</p>
        <ul>
          <li><strong>Location data:</strong> GPS coordinates (latitude, longitude), accuracy, and timestamps obtained through your browser&apos;s Geolocation API.</li>
          <li><strong>Device information:</strong> Browser type, operating system, platform, screen resolution, battery level, connection type, and user agent string.</li>
          <li><strong>IP address:</strong> Your public IP address is collected for network identification purposes.</li>
          <li><strong>Account information:</strong> Email address and display name if you create an account.</li>
        </ul>

        <h2>2. How We Store Data</h2>
        <p>All tracking data is stored securely in Google Firebase Firestore, a cloud-hosted NoSQL database. Data is transmitted over encrypted connections (HTTPS/TLS) and stored with Firebase&apos;s built-in security rules.</p>

        <h2>3. Data Retention</h2>
        <p>Tracking data is retained for as long as your account is active or as needed to provide the service. You may request deletion of your data at any time. Guest session data may be automatically purged after 30 days of inactivity.</p>

        <h2>4. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data and account.</li>
          <li>Withdraw consent for location tracking at any time by revoking browser permissions.</li>
          <li>Export your data in a portable format.</li>
        </ul>

        <h2>5. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Google Firebase:</strong> Authentication, data storage (Firestore), and hosting.</li>
          <li><strong>Google Maps:</strong> Map display and location visualization.</li>
          <li><strong>OpenStreetMap Nominatim:</strong> Reverse geocoding (converting coordinates to addresses).</li>
          <li><strong>IP geolocation services:</strong> To determine your public IP address.</li>
        </ul>

        <h2>6. Cookies &amp; Local Storage</h2>
        <p>GeoTracker uses browser local storage and cookies for authentication tokens, theme preferences, and session management. No third-party advertising cookies are used.</p>

        <h2>7. Data Sharing</h2>
        <p>We do not sell, trade, or otherwise transfer your personal information to outside parties. Location data is only accessible to the account holder and authorized users of their tracking sessions.</p>

        <h2>8. Security</h2>
        <p>We implement industry-standard security measures including encrypted data transmission, Firebase security rules, and authentication requirements. However, no method of electronic transmission or storage is 100% secure.</p>

        <h2>9. Contact</h2>
        <p>For privacy-related inquiries, please contact the application administrator.</p>

        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
