# 🚀 GeoTracker Deployment Guide

This guide covers deploying the GeoTracker application to various hosting platforms.

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

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest deployment option for Next.js applications.

**Steps:**

1. **Install Vercel CLI** (optional - you can also use the web interface):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

3. **Or Deploy via GitHub**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables in the Vercel dashboard
   - Deploy!

**Add Environment Variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add all `NEXT_PUBLIC_FIREBASE_*` variables
- Redeploy if needed

### Option 2: Firebase Hosting

Firebase Hosting is ideal since you're already using Firebase for the backend.

**Steps:**

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting** (if not already done):
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `out`
   - Configure as single-page app: Yes
   - Don't overwrite existing files

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Deploy to Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

6. **Deploy Firestore rules** (if needed):
   ```bash
   firebase deploy --only firestore:rules
   ```

**Note:** Firebase Hosting uses client-side environment variables that are embedded during build time. Make sure to build with the correct `.env.local` file configured.

### Option 3: Netlify

Netlify is another popular static hosting option.

**Steps:**

1. **Install Netlify CLI** (optional):
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy via CLI**:
   ```bash
   # Login
   netlify login
   
   # Build
   npm run build
   
   # Deploy
   netlify deploy --prod --dir=out
   ```

3. **Or Deploy via GitHub**:
   - Go to [netlify.com](https://www.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `out`
   - Add environment variables
   - Deploy!

**Configure Redirects** (create `netlify.toml`):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 4: GitHub Pages

GitHub Pages is free for public repositories.

**Steps:**

1. **Update `next.config.js`** with your repository base path:
   ```javascript
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true,
     },
     basePath: '/GeoTracker', // Your repo name
     assetPrefix: '/GeoTracker/',
   };
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy using GitHub Actions**:
   
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: ./out
     
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

4. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - Save

**Note:** For GitHub Pages, Firebase credentials will be embedded in the built static files. Make sure your Firebase security rules are properly configured.

### Option 5: Custom Server / VPS

Deploy to any server with Node.js support.

**Steps:**

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Copy the `out` directory** to your server

3. **Serve with a web server**:
   
   **Using Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/out;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   
   **Using Apache:**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /path/to/out
       
       <Directory /path/to/out>
           AllowOverride All
           Require all granted
           
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </Directory>
   </VirtualHost>
   ```

## 🔒 Security Checklist

Before deploying to production:

- [ ] Configure Firebase Security Rules (see `firestore.rules`)
- [ ] Enable Firebase Authentication (Email/Password and Anonymous)
- [ ] Use HTTPS (required for geolocation API)
- [ ] Review Firebase API key restrictions in Google Cloud Console
- [ ] Set up Firebase App Check for additional security (optional)
- [ ] Review application permissions and access controls

## 🧪 Testing Your Deployment

After deployment:

1. ✅ Visit your deployed URL
2. ✅ Test user registration/login
3. ✅ Create a tracker and generate a link
4. ✅ Test location tracking (requires HTTPS)
5. ✅ Verify data is stored in Firebase
6. ✅ Check browser console for errors

## 📊 Monitoring

- **Vercel/Netlify**: Check built-in analytics dashboard
- **Firebase**: Monitor usage in Firebase Console → Analytics
- **Custom**: Set up application monitoring (e.g., Sentry, LogRocket)

## 🔄 Continuous Deployment

For automatic deployments on git push:

- **Vercel/Netlify**: Automatically deploy on push to main branch
- **Firebase**: Set up GitHub Actions (see GitHub Pages example above)
- **Custom**: Configure CI/CD pipeline (e.g., Jenkins, GitLab CI)

## 🐛 Troubleshooting

**Build fails with Firebase error:**
- Ensure all environment variables are set correctly
- Check that `.env.local` exists with valid Firebase config

**Location tracking doesn't work:**
- Ensure your site is served over HTTPS
- Check browser permissions
- Verify geolocation is enabled on the device

**Firebase errors in production:**
- Check Firebase Security Rules are deployed
- Verify Authentication is enabled
- Check Firebase API quotas haven't been exceeded

## 📝 Notes

- The application uses static export (`output: 'export'` in `next.config.js`)
- All pages are pre-rendered at build time
- Firebase initialization is lazy-loaded at runtime
- Environment variables are embedded during build time (no server-side secrets)

## 🆘 Support

For deployment issues:
- Check [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- Review [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- Open an issue on GitHub

---

**Ready to deploy?** Choose your platform above and follow the steps! 🚀
