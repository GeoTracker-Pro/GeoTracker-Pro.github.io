# 🔥 Firebase Setup Guide for GeoTracker

This guide will help you set up your own Firebase project and configure GeoTracker to use it.

## ⚠️ Common Error: `auth/configuration-not-found`

If you're seeing this error, it means Firebase Authentication is not properly enabled in your Firebase Console. Follow the steps below to fix it.

## 📋 Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

## 🚀 Step-by-Step Setup

### 1. Create Your Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click **"Create a project"** (or **"Add project"**)
4. Enter a project name (e.g., "my-geotracker")
5. Optionally enable Google Analytics, then click **"Create project"**
6. Once the project is created, click **"Continue"**

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

### 6. Configure Environment Variables

GeoTracker reads Firebase configuration from environment variables. You need to register a **Web app** in your Firebase project and then provide the config values.

1. In Firebase Console, go to **Project Settings** (gear icon) > **General**
2. Under "Your apps", click the **Web** icon (`</>`) to add a web app
3. Enter a nickname (e.g., "GeoTracker Web") and click **"Register app"**
4. Copy the configuration values shown

Create a `.env.local` file in the project root with your values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Note:** Never commit `.env.local` to version control. For deployment, add these as GitHub Secrets or your hosting platform's environment variables.

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
- Verify the environment variables in `.env.local` match your Firebase project
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

## 💡 Using Your Firebase Project

Each deployment of GeoTracker uses its own Firebase project. To set up yours:

1. Create a new Firebase project in [Firebase Console](https://console.firebase.google.com/)
2. Follow steps 2-5 above for your new project
3. Set the environment variables as described in step 6
4. For GitHub Pages deployment, add the variables as repository secrets (see [DEPLOYMENT.md](./DEPLOYMENT.md))

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
