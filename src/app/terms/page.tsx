import Link from 'next/link';
import styles from './page.module.css';

export default function TermsPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.container}>
        <h1>Terms of Service</h1>
        <p className={styles.updated}>Last updated: January 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using GeoTracker, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>

        <h2>2. Description of Service</h2>
        <p>GeoTracker is a geolocation tracking application that allows users to monitor and record device locations in real time. The service provides location tracking, device information collection, geofencing, analytics, and emergency SOS features.</p>

        <h2>3. User Responsibilities</h2>
        <p>As a user of GeoTracker, you agree to:</p>
        <ul>
          <li>Use the service only for lawful purposes and in compliance with all applicable laws.</li>
          <li>Obtain proper consent before tracking any person or device that is not your own.</li>
          <li>Not use the service for stalking, harassment, or any unauthorized surveillance.</li>
          <li>Keep your account credentials secure and confidential.</li>
          <li>Not attempt to reverse-engineer, modify, or exploit the service.</li>
        </ul>

        <h2>4. Privacy</h2>
        <p>Your use of GeoTracker is also governed by our <Link href="/privacy">Privacy Policy</Link>, which describes how we collect, use, and protect your data. By using the service, you consent to the data practices described therein.</p>

        <h2>5. Consent for Tracking</h2>
        <p>By using GeoTracker, you explicitly consent to the collection of your location data, device information, and IP address as described in our Privacy Policy. You may revoke this consent at any time by revoking browser location permissions or deleting your account.</p>

        <h2>6. Disclaimer of Warranties</h2>
        <p>GeoTracker is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, error-free, or completely secure. Location accuracy depends on your device hardware and environmental conditions.</p>

        <h2>7. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, GeoTracker and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. This includes but is not limited to damages for loss of data, loss of profits, or personal injury.</p>

        <h2>8. Account Termination</h2>
        <p>We reserve the right to suspend or terminate your account if you violate these terms or engage in any activity that could harm the service or other users.</p>

        <h2>9. Changes to Terms</h2>
        <p>We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

        <h2>10. Contact</h2>
        <p>For questions about these terms, please contact the application administrator.</p>

        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
