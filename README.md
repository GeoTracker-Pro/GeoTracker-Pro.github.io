# 📍 GeoTracker

A full-stack location tracking application built with Next.js and Firebase. Features user authentication, real-time location tracking with 15-second intervals, and a comprehensive dashboard for managing trackers.

![Dashboard Screenshot](https://github.com/user-attachments/assets/52e1a35e-0817-4358-9c0a-046312fbd4fd)

## 🌟 Features

- **Firebase Backend**: Real-time database with Firestore and Firebase Authentication
- **User Authentication**: Email/password authentication with anonymous guest access
- **User Management**: View all registered users in the system
- **Real-time Location Tracking**: Uses HTML5 Geolocation API with 15-second auto-updates
- **Device Information Collection**: Captures browser, OS, screen resolution, IP address
- **Interactive Dashboard**: Manage and view all tracked locations
- **Embedded Maps**: Visualize locations on Google Maps
- **Secure Link Generation**: Create unique tracking links for each session
- **Responsive Design**: Works on desktop and mobile devices
- **Cloud Sync**: Data automatically syncs across all devices in real-time

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

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:3000`

5. **Login or Sign Up**
- Create a new account with email/password
- Or continue as a guest for quick access

### Production Build

```bash
npm run build
```

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
2. Open project `geotracker-865d3`
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

## 📈 Future Enhancements

- [ ] Real-time location updates (Firestore listeners)
- [ ] Geofencing and alerts
- [ ] Location history timeline
- [ ] Export data to CSV/JSON
- [ ] PWA support for mobile installation
- [ ] Dark mode support
- [ ] Push notifications

## 📄 License

MIT License - feel free to use for personal or commercial projects

## ⚠️ Disclaimer

This software is provided for legitimate tracking purposes only (e.g., finding lost devices, family safety, delivery tracking). Users are responsible for ensuring legal compliance and obtaining proper consent before tracking any device or individual.

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

---

**Note**: Always prioritize user privacy and comply with local laws regarding location tracking and data collection.
