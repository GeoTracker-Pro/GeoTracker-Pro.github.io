# 🚀 GeoTracker Deployment Guide

This guide covers deploying the GeoTracker application, with GitHub Pages as the recommended approach.

## Prerequisites

Before deploying, ensure you have:
- ✅ Firebase project configured (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
- ✅ Firebase environment variables ready
- ✅ Node.js 18+ installed
- ✅ Application built successfully (`npm run build`)

## 🔧 Environment Variables

The application requires these Firebase configuration variables for deployment:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Get these from [Firebase Console](https://console.firebase.google.com/) → Your Project → Project Settings → General

## 📦 Deployment Options

### Option 1: GitHub Pages (Recommended)

GitHub Pages is free and integrates directly with your repository. A GitHub Actions workflow (`.github/workflows/deploy.yml`) is already included in the repository.

**Steps:**

1. **Add Firebase secrets to your repository**:
   - Go to your repository on GitHub → **Settings** → **Secrets and variables** → **Actions**
   - Add each `NEXT_PUBLIC_FIREBASE_*` variable as a repository secret

2. **Enable GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**
   - Click **Save**

3. **Trigger a deployment**:
   - Push a commit to the `main` branch, or
   - Go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**

4. **Access your site** at `https://<username>.github.io/<repo-name>/`

**Note:** The `next.config.js` supports a `NEXT_PUBLIC_BASE_PATH` environment variable for the base path. The deploy workflow handles this automatically.

### Option 2: Vercel

Vercel offers seamless Next.js deployment.

1. Connect your GitHub repository at [vercel.com](https://vercel.com)
2. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel dashboard
3. Deploy — Vercel auto-detects Next.js settings

### Option 3: Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login && firebase init hosting`
   - Set public directory to `out`
   - Configure as single-page app: Yes
3. Build: `npm run build`
4. Deploy: `firebase deploy --only hosting`

**Note:** Set your environment variables in `.env.local` before building, as they are embedded at build time.

### Option 4: Other Static Hosts (Netlify, etc.)

1. Build: `npm run build`
2. Deploy the `out` directory to your hosting provider
3. Configure SPA redirect rules (all routes → `index.html`)
4. Set environment variables in your hosting provider's dashboard before building

## 🔒 Security Checklist

Before deploying to production:

- [ ] Configure Firestore security rules (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
- [ ] Enable Firebase Authentication (Email/Password and Anonymous)
- [ ] Use HTTPS (required for geolocation API)
- [ ] Review Firebase API key restrictions in Google Cloud Console
- [ ] Set up Firebase App Check for additional security (optional)

## 🧪 Testing Your Deployment

After deployment:

1. ✅ Visit your deployed URL
2. ✅ Test user registration/login
3. ✅ Create a tracker and generate a link
4. ✅ Test location tracking (requires HTTPS)
5. ✅ Verify data is stored in Firebase
6. ✅ Check browser console for errors

## 🐛 Troubleshooting

**Build fails with Firebase error:**
- Ensure all environment variables are set correctly
- For GitHub Pages, verify secrets are added in repository settings

**Location tracking doesn't work:**
- Ensure your site is served over HTTPS
- Check browser permissions
- Verify geolocation is enabled on the device

**Firebase errors in production:**
- Check Firebase security rules are configured
- Verify Authentication is enabled
- Check Firebase API quotas haven't been exceeded

## 📝 Notes

- The application uses static export (`output: 'export'` in `next.config.js`)
- All pages are pre-rendered at build time
- Firebase initialization is lazy-loaded at runtime
- Environment variables are embedded during build time (no server-side secrets)

---

**Ready to deploy?** Start with GitHub Pages — it's free and already configured! 🚀
