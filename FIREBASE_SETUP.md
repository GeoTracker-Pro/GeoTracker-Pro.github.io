# 🔥 Firebase Setup Guide for GeoTracker

This guide will help you fix the Firebase configuration error and get your GeoTracker application running.

## ⚠️ Common Error: `auth/configuration-not-found`

If you're seeing this error, it means Firebase Authentication is not properly enabled in your Firebase Console. Follow the steps below to fix it.

## 📋 Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)
- The Firebase project ID: `geotrackerpro-e3149`

## 🚀 Step-by-Step Setup

### 1. Access Your Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Select the project `geotrackerpro-e3149` (or create it if it doesn't exist)

### 2. Enable Firebase Authentication

1. In the Firebase Console, click on **"Authentication"** in the left sidebar
2. If you see a "Get Started" button, click it to enable Authentication
3. You'll be taken to the "Sign-in method" tab

### 3. Enable Sign-in Methods

You need to enable **TWO** authentication methods for GeoTracker to work:

#### A. Email/Password Authentication

1. Click on **"Email/Password"** in the list of providers
2. Click **"Enable"** toggle switch
3. **Important:** Keep "Email link (passwordless sign-in)" DISABLED (optional)
4. Click **"Save"**

#### B. Anonymous Authentication

1. Click on **"Anonymous"** in the list of providers
2. Click **"Enable"** toggle switch
3. Click **"Save"**

### 4. Configure Firestore Database (if not already done)

1. Click on **"Firestore Database"** in the left sidebar
2. Click **"Create database"** if you haven't already
3. Choose **"Start in test mode"** for development (you can tighten security rules later)
4. Select a Cloud Firestore location (choose the one closest to your users)
5. Click **"Enable"**

### 5. Set Firestore Security Rules (⚠️ CRITICAL FOR PRODUCTION)

**This step is required to fix "Missing or insufficient permissions" errors.**

#### Option A: Deploy using Firebase CLI (Recommended)

The repository includes a `firestore.rules` file with the correct security rules. Deploy them using:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules only
firebase deploy --only firestore:rules
```

#### Option B: Manual Configuration via Console

1. Go to **Firestore Database** > **Rules** tab in Firebase Console
2. Replace the rules with the following:

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

3. Click **"Publish"** to save the rules

⚠️ **Important**: Without these rules, you will see "Missing or insufficient permissions" errors when trying to create trackers or users

### 6. Verify Your Configuration

Your Firebase configuration in `src/lib/firebase.ts` should already have these values:

```javascript
{
  apiKey: "AIzaSyALuk1ujZBLTWMCJJ6ebT9DdH9CtYwVJ6I",
  authDomain: "geotrackerpro-e3149.firebaseapp.com",
  projectId: "geotrackerpro-e3149",
  storageBucket: "geotrackerpro-e3149.firebasestorage.app",
  messagingSenderId: "948578635618",
  appId: "1:948578635618:web:803ddf06141f602dd7a63b",
  measurementId: "G-23B0643XX7"
}
```

**Note:** These values are safe to commit to your repository. Firebase security rules protect your data, not these configuration values.

## 🧪 Testing Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. Try one of the following:
   - Click **"Continue as Guest"** (tests Anonymous authentication)
   - Click **"Sign Up"** and create a new account (tests Email/Password authentication)

4. If authentication succeeds and you're redirected to the dashboard, congratulations! 🎉

## 🐛 Troubleshooting

### Still seeing `auth/configuration-not-found`?

1. **Clear browser cache and cookies**
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Clear cached images and cookies
   - Restart your browser

2. **Verify Authentication is enabled**
   - Go to Firebase Console > Authentication
   - Make sure you see "Users" tab (this means Authentication is enabled)
   - Check that Email/Password and Anonymous are both enabled in the "Sign-in method" tab

3. **Check browser console**
   - Open Developer Tools (F12)
   - Look at the Console tab for more detailed error messages
   - The application now logs helpful Firebase initialization messages

4. **Wait a few minutes**
   - Sometimes Firebase takes a few minutes to propagate settings
   - Try again after 5-10 minutes

### Error: `auth/operation-not-allowed`

This means the sign-in method is not enabled:
- Go to Firebase Console > Authentication > Sign-in method
- Enable both "Email/Password" and "Anonymous"

### Error: `auth/invalid-api-key`

This means there's an issue with the API key:
- Verify the API key in `src/lib/firebase.ts` matches your Firebase project
- You can find your correct API key in Firebase Console > Project Settings > General

### Network errors

- Check your internet connection
- Verify you can access `https://firebase.google.com`
- Check if any firewall or proxy is blocking Firebase services

## 🔒 Security Best Practices

### For Production:

1. **Update Firestore Security Rules** (as shown in step 5)
2. **Restrict API key** (optional):
   - Go to Google Cloud Console
   - APIs & Services > Credentials
   - Find your API key and restrict it to specific domains

3. **Enable App Check** (optional but recommended):
   - Protects your Firebase resources from abuse
   - Follow [Firebase App Check documentation](https://firebase.google.com/docs/app-check)

4. **Monitor usage**:
   - Check Firebase Console > Usage and billing
   - Set up budget alerts

## 📚 Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)

## 💡 Using Custom Firebase Project (Optional)

If you want to use your own Firebase project instead:

1. Create a new Firebase project in [Firebase Console](https://console.firebase.google.com/)
2. Follow steps 2-5 above for your new project
3. Update `src/lib/firebase.ts` with your project's configuration values
4. Or use environment variables (see `.env.local.example`)

## 🎯 Quick Checklist

Before running the app, ensure:

- [ ] Firebase project exists
- [ ] Authentication is enabled (you can see the "Users" tab)
- [ ] Email/Password sign-in method is enabled
- [ ] Anonymous sign-in method is enabled
- [ ] Firestore database is created
- [ ] (Optional) Security rules are configured for production

---

**Need more help?** Check the [main README.md](./README.md) or open an issue on GitHub.
