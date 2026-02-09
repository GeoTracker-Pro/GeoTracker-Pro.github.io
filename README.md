# 📍 GeoTracker

A full-stack location tracking application built with Next.js and Firebase. Features user authentication, real-time location tracking with 15-second intervals, and a comprehensive dashboard for managing trackers.

![Dashboard Screenshot](https://github.com/user-attachments/assets/52e1a35e-0817-4358-9c0a-046312fbd4fd)

## 🎯 What Makes GeoTracker Different

GeoTracker is designed as a **privacy-focused, self-hosted location tracking solution** that gives you complete control over your data:

- ✨ **No Third-Party Dependencies**: All data stays in your Firebase project
- 🚀 **Quick Setup**: Deploy in minutes with simple Firebase configuration
- 🔓 **Open Source**: Full source code access, MIT licensed
- 💰 **Free to Use**: No subscription fees, runs on Firebase's free tier for small projects
- 🛠️ **Customizable**: Easy to extend with additional features
- 📱 **Web-Based**: No app installation required, works across all devices

**Perfect for:**
- 👨‍👩‍👧‍👦 Family safety and location sharing
- 📦 Delivery and fleet tracking
- 🏃 Personal fitness route recording
- 📱 Finding lost/stolen devices
- 🏢 Employee field tracking (with consent)
- 🚗 Vehicle location monitoring

## 🌟 Features

### Core Capabilities
- 🔐 **Firebase Backend**: Real-time database with Firestore and Firebase Authentication
- 👤 **User Authentication**: Email/password authentication with anonymous guest access
- 👥 **User Management**: View all registered users with admin controls
- 📍 **Real-time Location Tracking**: HTML5 Geolocation API with 15-second auto-updates
- 🖥️ **Device Information Collection**: Captures browser, OS, screen resolution, IP address
- 📊 **Interactive Dashboard**: Manage and view all tracked locations with real-time sync
- 🗺️ **Embedded Maps**: Visualize locations on Google Maps
- 🔗 **Secure Link Generation**: Create unique tracking links for each session
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ☁️ **Cloud Sync**: Data automatically syncs across all devices in real-time
- 💾 **Data Export**: Export tracker data to JSON or CSV formats
- 🔍 **Search & Filter**: Find trackers quickly by name or ID
- 🛡️ **Input Sanitization**: XSS protection and comprehensive input validation
- 🔄 **Fallback Storage**: LocalStorage backup when Firebase is unavailable

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project (already configured)
- Modern web browser with geolocation support

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/your-username/GeoTracker.git
cd GeoTracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your Firebase configuration values. The example file includes default values for the geotrackerpro-e3149 project. See [Configuration](#-configuration) section below for more details.

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

6. **Login or Sign Up**
- Create a new account with email/password
- Or continue as a guest for quick access

### Production Build

```bash
npm run build
```

## 🔧 Configuration

### Required Environment Variables

The application requires Firebase configuration via environment variables. Copy `.env.local.example` to `.env.local` and update the values:

```bash
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Admin Email (Optional)
NEXT_PUBLIC_ADMIN_EMAIL=your-admin@email.com
```

**Important Notes:**
- Without proper Firebase configuration, the application will not work
- Get these values from [Firebase Console](https://console.firebase.google.com/) > Project Settings > General
- The `.env.local.example` file contains default values for quick setup
- Never commit your `.env.local` file to version control

## 🌐 Deployment Options

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Deploy (no additional configuration needed - Firebase config is already in the code)

### Netlify / Other Static Hosts

1. Build the project: `npm run build`
2. Deploy the `out` directory
3. Configure redirect rules for SPA routing

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 📖 Usage

### Authentication

- **Sign Up**: Create a new account with email and password (minimum 6 characters)
- **Sign In**: Login with your existing credentials
- **Guest Access**: Click "Continue as Guest" for anonymous access

### Creating a Tracking Link

1. Login to the dashboard
2. Enter a name for your tracker (e.g., "Family Trip", "Lost Phone")
3. Click "Generate Tracking Link"
4. Share the generated link with the person whose location you want to track

### Tracking Process

1. When someone clicks the tracking link, they'll be taken to a page that requests location permission
2. Once permission is granted, their location and device information will be captured
3. **Location updates automatically every 15 seconds** to Firebase
4. The tracked person can see their own location on an embedded map
5. A visual indicator shows the auto-update status and count

### Viewing Tracked Locations

1. Go to the dashboard
2. Click on any tracker card to expand and view all recorded locations
3. Click "View on Map" to open the location in Google Maps
4. The dashboard auto-refreshes every 10 seconds

### Viewing Users

1. Click "Users" in the dashboard header
2. View all registered users in the system
3. See when they joined and their last activity

## 🏗️ Project Structure

```
GeoTracker/
├── src/
│   ├── app/
│   │   ├── dashboard/            # Protected dashboard
│   │   ├── login/                # Login/signup page
│   │   ├── users/                # User management page
│   │   ├── track/                # Tracking page (with ID parameter)
│   │   ├── tracker/              # Standalone tracker page
│   │   ├── providers.tsx         # Auth context provider wrapper
│   │   └── layout.tsx            # Root layout with providers
│   ├── lib/
│   │   ├── firebase.ts           # Firebase initialization
│   │   ├── firebase-services.ts  # Firestore CRUD operations
│   │   ├── auth-context.tsx      # Authentication context
│   │   └── storage.ts            # Storage utilities (Firebase + localStorage fallback)
│   └── styles/
│       └── globals.css           # Global styles
├── .env.local.example            # Example environment variables
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md
```

## 🔧 Technical Details

### Technologies Used
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **Firebase**: Backend-as-a-Service
  - **Firestore**: NoSQL database for trackers and users
  - **Firebase Auth**: User authentication
- **TypeScript**: Type-safe development
- **CSS Modules**: Scoped styling
- **HTML5 Geolocation API**: For location tracking

### Data Storage
- **Firestore Collections**:
  - `trackers`: Stores tracker data and location history
  - `users`: Stores user profile information
- **LocalStorage Fallback**: Falls back to localStorage if Firebase is unavailable

### Location Data Captured
- Latitude & Longitude (6 decimal precision)
- Accuracy (in meters)
- Timestamp
- Browser type
- Operating System
- Platform
- Screen resolution
- IP address (via external API)
- User agent string

### Known Limitations

#### Technical Constraints
- **Update Frequency**: Fixed at 15 seconds (not configurable via UI)
- **Browser Dependency**: Requires modern browser with Geolocation API support
- **HTTPS Required**: Geolocation API only works on secure connections (HTTPS or localhost)
- **Battery Drain**: Continuous tracking can drain device battery quickly
- **No Background Tracking**: Tab must remain open for tracking to continue
- **Single Map Provider**: Only Google Maps (no Leaflet/Mapbox alternatives)

#### Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (iOS requires user interaction first)
- ⚠️ Older Browsers: May lack Geolocation API support

#### Mobile Limitations
- **iOS Safari**: Requires user interaction before requesting location permission
- **Battery Optimization**: Android may throttle location updates when battery saver is on
- **Background Restrictions**: Modern mobile browsers limit background activity
- **Screen Lock**: Location tracking pauses when device screen is locked

## 🔒 Privacy & Security Considerations

⚠️ **Important**: This application collects sensitive location data. Please ensure:

1. **Legal Compliance**: Only track devices with explicit consent
2. **User Notification**: Always inform users that their location will be tracked
3. **HTTPS**: Required for geolocation API to work in modern browsers
4. **Firebase Security Rules**: Configure Firestore rules for production use

### Deploying Firestore Security Rules

The repository includes a `firestore.rules` file with production-ready security rules. Deploy them using:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy rules
firebase login
firebase deploy --only firestore:rules
```

Alternatively, copy the rules from `firestore.rules` to your Firebase Console > Firestore Database > Rules tab.

### Security Rules Overview

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📱 Mobile Support

- Modern mobile browsers support geolocation API
- iOS requires user interaction before requesting location
- Android may require additional permissions
- Works in Chrome, Safari, Firefox mobile browsers

## 🐛 Troubleshooting

### ⚠️ Firebase Error: `Missing or insufficient permissions`

**This error means Firestore security rules are not configured correctly.**

**Quick Fix:**
1. Deploy the included `firestore.rules` file:
   ```bash
   firebase login
   firebase deploy --only firestore:rules
   ```
2. Or manually copy the rules from `firestore.rules` to Firebase Console > Firestore Database > Rules

📖 **For detailed instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

### ⚠️ Firebase Error: `auth/configuration-not-found`

**This means Firebase Authentication is not enabled in your Firebase Console.**

**Quick Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open project `geotrackerpro-e3149`
3. Enable Authentication (click "Get Started" if needed)
4. Enable **Email/Password** sign-in method
5. Enable **Anonymous** sign-in method

📖 **For detailed step-by-step instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

### Other Common Issues

**Location not working?**
- Check browser permissions
- Ensure HTTPS (required for geolocation on most browsers)
- Verify geolocation is enabled on device

**Firebase connection issues?**
- Check browser console for Firebase errors
- Verify Firebase project is active
- Ensure Firestore is enabled in Firebase console

**Authentication issues?**
- Clear browser cookies and try again
- Check if Firebase Auth is enabled in console
- Verify email/password provider is enabled

**Build errors?**
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Ensure Node.js 18+ is installed

## ❓ Frequently Asked Questions (FAQ)

### General Questions

**Q: Is GeoTracker free to use?**  
A: Yes, GeoTracker is open source (MIT license) and free to use. You'll need a Firebase account, which has a generous free tier for small projects.

**Q: Can I track someone without their knowledge?**  
A: **No.** The person being tracked must click the tracking link and grant location permissions in their browser. This is a legal and ethical requirement.

**Q: How accurate is the location tracking?**  
A: Accuracy depends on the device and location method (GPS, Wi-Fi, cell towers). Typically 5-50 meters. GPS on modern smartphones can be accurate to within 5 meters.

**Q: Does it work offline?**  
A: Partially. Location updates require an internet connection to sync to Firebase. There's a local storage fallback, but no full offline PWA support currently.

**Q: Can I track multiple devices simultaneously?**  
A: Yes! Create separate trackers for each device you want to monitor.

### Technical Questions

**Q: Why does tracking stop when I close the browser tab?**  
A: Web browsers restrict background activity for security and battery life. For continuous tracking, the tab must remain open. Consider using a PWA (future feature) or native app for true background tracking.

**Q: Can I change the 15-second update interval?**  
A: Not via the UI currently. The interval is hardcoded in the tracking page. You can modify `src/app/track/page.tsx` to change it. **Warning**: Shorter intervals (e.g., 5s) will drain battery faster and increase Firebase usage, while longer intervals (e.g., 60s) may result in less accurate tracking and stale data.

**Q: Does this drain my phone battery?**  
A: Yes, continuous GPS tracking consumes battery. The 15-second update interval is a balance between accuracy and battery life. More frequent updates = faster battery drain.

**Q: Can I self-host this without Firebase?**  
A: Currently, no. Firebase is tightly integrated. You'd need to replace Firebase Auth and Firestore with alternatives (Supabase, PostgreSQL, etc.).

**Q: Is my location data secure?**  
A: Data is stored in your Firebase project with security rules. Only authenticated users can access the data. However, you're responsible for managing access and ensuring compliance with privacy laws.

**Q: Can I use a different map provider (not Google Maps)?**  
A: Not currently. Google Maps is embedded. Adding Leaflet or Mapbox would require code changes (future enhancement).

### Privacy & Legal

**Q: Is this GDPR compliant?**  
A: The codebase includes basic security measures, but full GDPR compliance requires additional features like data deletion on request, audit logging, and explicit consent mechanisms (currently missing). **Important**: Technical measures alone don't guarantee GDPR compliance. Consult with legal counsel to ensure your implementation meets all regulatory requirements for your jurisdiction and use case.

**Q: Can I use this for commercial purposes?**  
A: Yes, it's MIT licensed. However, ensure you comply with local laws regarding location tracking and obtain proper consent from users.

**Q: How long is location data stored?**  
A: Indefinitely in Firebase, until you manually delete trackers. There's no automatic data retention policy (future enhancement).

### Development & Contribution

**Q: Can I contribute new features?**  
A: Absolutely! See the [Contributing](#-contributing) section. PRs are welcome.

**Q: How do I add a new feature?**  
A: Fork the repo, make your changes, test thoroughly, and submit a PR. Check the "Missing Features" section for ideas.

**Q: Is there a mobile app?**  
A: No native mobile app currently. It's a responsive web app that works on mobile browsers. PWA support is planned for future releases.

## 📊 Current Feature Status

### ✅ Implemented Features

| Category | Features |
|----------|----------|
| **Authentication** | ✅ Email/Password login & signup<br>✅ Guest mode (anonymous)<br>✅ Session persistence<br>✅ Logout functionality |
| **Location Tracking** | ✅ Real-time auto-updates (15-second intervals)<br>✅ High-accuracy positioning<br>✅ Device info collection (browser, OS, screen, IP)<br>✅ Retry logic with exponential backoff |
| **Dashboard** | ✅ Tracker management (create, view, delete)<br>✅ Shared link generation<br>✅ Real-time Firestore listeners<br>✅ Search & filter trackers<br>✅ Auto-refresh indicator |
| **User Management** | ✅ View all registered users<br>✅ User search functionality<br>✅ Admin features (delete users)<br>✅ User metadata display |
| **Data Visualization** | ✅ Google Maps embeds<br>✅ Location info cards<br>✅ Device information display<br>✅ Multi-location history |
| **Storage** | ✅ Firestore cloud database<br>✅ Real-time sync across devices<br>✅ LocalStorage fallback<br>✅ Sub-collection architecture |
| **Export** | ✅ JSON export with metadata<br>✅ CSV export (spreadsheet compatible)<br>✅ Proper field escaping |
| **Security** | ✅ Environment variable config<br>✅ Firestore security rules<br>✅ XSS protection & input sanitization<br>✅ Admin access control |

### 🔄 Feature Comparison

Compare GeoTracker with typical location tracking applications:

| Feature Category | GeoTracker | Typical Tracking Apps |
|------------------|------------|----------------------|
| **Basic Tracking** | ✅ Implemented | ✅ Standard |
| **Real-time Updates** | ✅ 15-second intervals | ✅ 1-60 seconds |
| **User Authentication** | ✅ Email + Guest | ✅ Multiple methods |
| **Map Visualization** | ✅ Google Maps | ✅ Multiple providers |
| **Data Export** | ✅ JSON/CSV | ✅ Various formats |
| **Admin Panel** | ✅ Basic | ✅ Advanced |
| **Push Notifications** | ❌ Not available | ✅ Standard |
| **Geofencing** | ❌ Not available | ✅ Common |
| **Offline Mode** | ⚠️ Limited (LocalStorage) | ✅ Full PWA support |
| **Multi-user Sharing** | ❌ Not available | ✅ Common |
| **Analytics Dashboard** | ❌ Not available | ✅ Advanced |
| **Mobile App** | ⚠️ Web only | ✅ Native apps |
| **API Access** | ❌ Not available | ✅ REST/GraphQL |
| **Third-party Integrations** | ❌ Not available | ✅ Webhooks/Zapier |
| **Custom Alerts** | ❌ Not available | ✅ Configurable |
| **Dark Mode** | ❌ Not available | ✅ Common |
| **Localization** | ❌ English only | ✅ Multi-language |

**Legend:** ✅ Fully Available | ⚠️ Partially Available | ❌ Not Available

### ❌ Missing Features & Potential Enhancements

#### 🔔 Notifications & Alerts
- [ ] Push notifications (web/mobile)
- [ ] Email alerts for location updates
- [ ] SMS notifications
- [ ] In-app notification system
- [ ] Customizable alert rules

#### 📍 Advanced Geofencing
- [ ] Create custom geofence zones
- [ ] Entry/exit boundary alerts
- [ ] Location-based automation triggers
- [ ] Speed limit monitoring
- [ ] Proximity alerts between trackers

#### 📱 Progressive Web App (PWA)
- [ ] Service worker implementation
- [ ] Offline functionality
- [ ] Background sync for location updates
- [ ] Add to home screen support
- [ ] Offline location data queuing
- [ ] App-like mobile experience

#### 👥 Multi-User Collaboration
- [ ] Share trackers between users
- [ ] Permission-based access (read/write/admin)
- [ ] Team collaboration features
- [ ] Invite system for tracker sharing
- [ ] Role-based access control

#### 📊 Analytics & Reporting
- [ ] Distance traveled calculations
- [ ] Speed analytics and graphs
- [ ] Location heatmaps
- [ ] Movement pattern analysis
- [ ] Dwell time tracking
- [ ] Route optimization suggestions
- [ ] Time-based reports (daily/weekly/monthly)

#### 🗺️ Enhanced Mapping
- [ ] Multiple map providers (Leaflet, Mapbox)
- [ ] Custom map layers and styles
- [ ] Route visualization and playback
- [ ] Path drawing and annotation
- [ ] Offline map support
- [ ] Satellite/terrain view options
- [ ] Real-time location animation

#### 📲 Device Enhancements
- [ ] Battery level tracking
- [ ] Wi-Fi network name capture
- [ ] Cellular signal strength
- [ ] Location method indicator (GPS/Wi-Fi/Cell)
- [ ] Device orientation/heading
- [ ] Motion detection (walking/driving/stationary)

#### 🔌 API & Integrations
- [ ] REST API endpoints
- [ ] Webhook support for location updates
- [ ] Third-party integrations (Slack, Discord, Telegram)
- [ ] IFTTT/Zapier integration
- [ ] Custom data endpoints
- [ ] GraphQL API

#### ⚙️ Settings & Customization
- [ ] User preferences page
- [ ] Configurable update frequency (currently fixed at 15s)
- [ ] Accuracy preference settings
- [ ] Data retention policies
- [ ] Theme customization (dark mode)
- [ ] Language localization (i18n)
- [ ] Timezone management
- [ ] Custom branding options

#### 🔐 Security & Compliance
- [ ] Two-factor authentication (2FA)
- [ ] Activity audit logging
- [ ] GDPR compliance tools (data deletion on request)
- [ ] Terms of service page
- [ ] Privacy policy page
- [ ] Cookie consent banner
- [ ] End-to-end encryption
- [ ] Secure API key management

#### 📈 Advanced Features
- [ ] Location history playback with animation
- [ ] Reverse geocoding (address from coordinates)
- [ ] Address search and place lookup
- [ ] Batch tracker management
- [ ] Scheduled tracking (start/stop times)
- [ ] Location prediction/ETA calculation
- [ ] Emergency SOS button
- [ ] Location sharing via QR code

#### 🛠️ Developer Experience
- [ ] Comprehensive unit tests
- [ ] Integration tests
- [ ] E2E testing setup
- [ ] API documentation
- [ ] Docker containerization
- [ ] CI/CD pipeline enhancements
- [ ] Performance monitoring
- [ ] Error tracking (Sentry integration)

#### 📄 Documentation
- [ ] Video tutorials
- [ ] API reference documentation
- [ ] Migration guides
- [ ] Troubleshooting guides with screenshots
- [ ] Best practices guide
- [ ] Contributing guidelines

## 📈 Roadmap

### Phase 1 (Core Improvements)
1. PWA support with offline capabilities
2. Push notifications system
3. Dark mode support
4. Enhanced map visualization with route playback

### Phase 2 (Advanced Features)
1. Geofencing and automated alerts
2. Multi-user collaboration and sharing
3. Analytics dashboard with charts
4. REST API and webhook support

### Phase 3 (Enterprise Features)
1. Two-factor authentication
2. Audit logging and compliance tools
3. Third-party integrations
4. Advanced reporting and export options

## 📄 License

MIT License - feel free to use for personal or commercial projects

## ⚠️ Disclaimer

This software is provided for legitimate tracking purposes only (e.g., finding lost devices, family safety, delivery tracking). Users are responsible for ensuring legal compliance and obtaining proper consent before tracking any device or individual.

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

---

**Note**: Always prioritize user privacy and comply with local laws regarding location tracking and data collection.
