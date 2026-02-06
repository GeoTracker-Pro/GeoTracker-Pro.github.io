# 📍 GeoTracker

A browser-based location tracking application built with Next.js. This application can be completely hosted on GitHub Pages with no backend server required!

![Dashboard Screenshot](https://github.com/user-attachments/assets/52e1a35e-0817-4358-9c0a-046312fbd4fd)

## 🌟 Features

- **Static Hosting**: Fully deployable to GitHub Pages - no server needed!
- **Real-time Location Tracking**: Uses HTML5 Geolocation API for accurate positioning
- **Device Information Collection**: Captures browser, OS, screen resolution, IP address
- **Interactive Dashboard**: Manage and view all tracked locations
- **Embedded Maps**: Visualize locations on Google Maps
- **Secure Link Generation**: Create unique tracking links for each session
- **Responsive Design**: Works on desktop and mobile devices
- **Client-side Storage**: Uses localStorage for data persistence

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
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

### Production Build

```bash
npm run build
```

The static files will be generated in the `out` directory.

## 🌐 Deploying to GitHub Pages

This project includes automatic deployment to GitHub Pages via GitHub Actions.

### Automatic Deployment

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

2. **Push to main branch**
   - The workflow will automatically build and deploy your site
   - Your site will be available at `https://your-username.github.io/GeoTracker`

### Manual Deployment

1. Build the project with the correct base path:
```bash
NEXT_PUBLIC_BASE_PATH=/GeoTracker npm run build
```

2. Deploy the `out` folder to your hosting provider.

## 📖 Usage

### Creating a Tracking Link

1. Open the dashboard at your deployment URL
2. Enter a name for your tracker (e.g., "Family Trip", "Lost Phone")
3. Click "Create Tracking Link"
4. Share the generated link with the person whose location you want to track

### Tracking Process

1. When someone clicks the tracking link, they'll be taken to a page that requests location permission
2. Once permission is granted, their location and device information will be captured
3. The data is stored in localStorage and displayed on the dashboard
4. The tracked person can see their own location on an embedded map

### Viewing Tracked Locations

1. Go to the dashboard
2. Click on any tracker card to expand and view all recorded locations
3. Click "View on Map" to open the location in Google Maps
4. The dashboard auto-refreshes every 10 seconds

## 🏗️ Project Structure

```
GeoTracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard page
│   │   ├── page.module.css     # Dashboard styles
│   │   ├── track/
│   │   │   ├── page.tsx        # Tracking page (with ID parameter)
│   │   │   └── page.module.css
│   │   └── tracker/
│   │       ├── page.tsx        # Standalone tracker page
│   │       └── page.module.css
│   ├── lib/
│   │   └── storage.ts          # Client-side storage utilities
│   └── styles/
│       └── globals.css         # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment workflow
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── README.md
```

## 🔧 Technical Details

### Technologies Used
- **Next.js 15**: React framework with static export support
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **CSS Modules**: Scoped styling
- **HTML5 Geolocation API**: For location tracking

### Data Storage
- Uses browser localStorage for data persistence
- All data stays on the client device
- No backend server required

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
3. **HTTPS**: GitHub Pages serves over HTTPS by default (required for geolocation)
4. **Data Storage**: Data is stored locally in the browser - no server uploads

## 📱 Mobile Support

- Modern mobile browsers support geolocation API
- iOS requires user interaction before requesting location
- Android may require additional permissions
- Works in Chrome, Safari, Firefox mobile browsers

## 🐛 Troubleshooting

**Location not working?**
- Check browser permissions
- Ensure HTTPS (required for geolocation on most browsers)
- Verify geolocation is enabled on device

**Data not persisting?**
- localStorage is domain-specific
- Private/incognito mode may disable localStorage
- Check if localStorage is enabled in browser settings

**Build errors?**
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Ensure Node.js 18+ is installed

## 📈 Future Enhancements

- [ ] Real-time location updates (WebSockets)
- [ ] Geofencing and alerts
- [ ] Location history timeline
- [ ] Export data to CSV/JSON
- [ ] PWA support for mobile installation
- [ ] Dark mode support

## 📄 License

MIT License - feel free to use for personal or commercial projects

## ⚠️ Disclaimer

This software is provided for legitimate tracking purposes only (e.g., finding lost devices, family safety, delivery tracking). Users are responsible for ensuring legal compliance and obtaining proper consent before tracking any device or individual.

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

---

**Note**: Always prioritize user privacy and comply with local laws regarding location tracking and data collection.
