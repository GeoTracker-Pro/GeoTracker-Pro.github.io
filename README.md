# 📍 GeoTracker

A browser-based location tracking application built with Next.js. Features real-time location tracking with 15-second intervals, link sharing, and a cyber-themed dashboard for managing trackers. Fully static, hostable on GitHub Pages without any backend.

![Dashboard Screenshot](https://github.com/user-attachments/assets/52e1a35e-0817-4358-9c0a-046312fbd4fd)

## 🌟 Features

- **localStorage Storage**: Client-side persistent storage for trackers and location data
- **Link Sharing**: Share tracking links that auto-create trackers for recipients
- **Real-time Location Tracking**: Uses HTML5 Geolocation API with 15-second auto-updates
- **Device Information Collection**: Captures browser, OS, screen resolution, IP address
- **Interactive Dashboard**: Manage and view all tracked locations
- **Embedded Maps**: Visualize locations on Google Maps
- **Cyber Theme**: Dark surveillance aesthetic with green/cyan color scheme
- **Secure Link Generation**: Create unique tracking links for each session
- **Responsive Design**: Works on desktop and mobile devices
- **No Backend Required**: Fully static deployment compatible with GitHub Pages

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

6. **Setup admin account**
On first visit, you'll be prompted to create an admin account.

### Production Build

```bash
npm run build
```

The application requires a Node.js server to run (cannot be deployed as static files).

## 🌐 Deployment Options

### GitHub Pages (Recommended)

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Set source to GitHub Actions
4. The included workflow will automatically deploy on push

### Vercel / Netlify

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Output directory: `out`
4. Deploy

## 📖 Usage

### Creating a Tracking Link

1. Go to the Tracker page
2. Enter a name for your tracker (e.g., "Family Trip", "Lost Phone")
3. Click "Create Tracking Link"
4. Share the generated link with the person whose location you want to track

### Tracking Process

1. When someone clicks the tracking link, they'll be taken to a page that requests location permission
2. Once permission is granted, their location and device information will be captured
3. **Location updates automatically every 15 seconds** to localStorage
4. The tracked person can see their own location on an embedded map
5. A visual indicator shows the auto-update status and count

### Viewing Tracked Locations

1. Go to the dashboard
2. View all tracker cards with their recorded locations
3. Click "View on Map" to open the location in Google Maps
4. All data is stored locally in your browser's localStorage

## 🏗️ Project Structure

```
GeoTracker/
├── src/
│   ├── app/
│   │   ├── dashboard/            # Dashboard page
│   │   ├── login/                # Login page
│   │   ├── users/                # Users page
│   │   ├── track/                # Tracking page (with ID parameter)
│   │   ├── tracker/              # Standalone tracker page
│   │   └── page.tsx              # Home page with cyber theme
│   ├── lib/
│   │   └── storage.ts            # localStorage utilities and getOrCreateTracker
│   └── styles/
│       └── globals.css           # Global styles with cyber theme colors
├── .env.local.example            # Example environment variables
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md
```

## 🔧 Technical Details

### Technologies Used
- **Next.js 15**: React framework with API routes
- **React 19**: UI library
- **MongoDB**: Database for persistent storage
- **Mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **TypeScript**: Type-safe development
- **CSS Modules**: Scoped styling
- **HTML5 Geolocation API**: For location tracking

### Data Storage
- **MongoDB**: All tracker and user data stored in MongoDB
- **Secure Authentication**: Passwords hashed with bcrypt, JWT tokens in HTTP-only cookies
- **Real-time Updates**: Location data sent to server every 15 seconds

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
4. **Secure Environment Variables**: Keep MONGODB_URI and JWT_SECRET confidential
5. **Strong Passwords**: Use minimum 6 character passwords with complexity

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

**Database connection issues?**
- Verify MONGODB_URI is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure the database user has proper permissions

**Authentication issues?**
- Verify JWT_SECRET is set
- Clear browser cookies and try again
- Check if the user exists in the database

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
