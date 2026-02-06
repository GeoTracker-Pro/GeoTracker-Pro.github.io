# 📍 Location Tracker Service

A browser-based edge computing location tracking application that captures device location and information through shared links.

## 🌟 Features

- **Edge Computing**: Runs entirely in the browser, no heavy backend processing
- **Real-time Location Tracking**: Uses HTML5 Geolocation API for accurate positioning
- **Device Information Collection**: Captures browser, OS, screen resolution, IP address
- **Interactive Dashboard**: Manage and view all tracked locations
- **Embedded Maps**: Visualize locations on Google Maps
- **Secure Link Generation**: Create unique tracking links for each session
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with geolocation support

## 🚀 Installation

1. **Clone or download the project files**

2. **Install dependencies**
```bash
npm install
```

3. **Create the public directory structure**
```bash
mkdir -p public
```

4. **Move the HTML files to the public directory**
```bash
mv tracker.html public/
mv dashboard.html public/
```

5. **Start the server**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📖 Usage

### Creating a Tracking Link

1. Open the dashboard at `http://localhost:3000`
2. Enter a name for your tracker (e.g., "Lost Phone", "Family Trip")
3. Click "Create Tracking Link"
4. Share the generated link with the person whose location you want to track

### Tracking Process

1. When someone clicks the tracking link, they'll be taken to a page that requests location permission
2. Once permission is granted, their location and device information will be captured
3. The data is sent to your server and displayed on the dashboard
4. The tracked person can see their own location on an embedded map

### Viewing Tracked Locations

1. Go to the dashboard at `http://localhost:3000`
2. Click on any tracker card to expand and view all recorded locations
3. Click "View on Map" to open the location in Google Maps
4. The dashboard auto-refreshes every 10 seconds

## 🏗️ Project Structure

```
location-tracker/
├── server.js              # Express server handling API requests
├── package.json           # Project dependencies
├── location-data.json     # Data storage (auto-generated)
├── public/
│   ├── dashboard.html     # Dashboard interface for managing trackers
│   └── tracker.html       # Location capture page
└── location-tracker.html  # Standalone version (no server needed)
```

## 🔧 Technical Details

### Frontend Technologies
- **HTML5 Geolocation API**: For accurate location tracking
- **Fetch API**: For server communication
- **CSS3**: Modern, responsive styling
- **Vanilla JavaScript**: No framework dependencies

### Backend Technologies
- **Node.js + Express**: Lightweight server
- **File-based storage**: JSON file for data persistence (easily upgradeable to database)
- **CORS enabled**: For cross-origin requests

### Location Data Captured
- Latitude & Longitude (6 decimal precision)
- Accuracy (in meters)
- Timestamp
- Browser type
- Operating System
- Platform
- Screen resolution
- IP address
- User agent string

## 🔒 Privacy & Security Considerations

⚠️ **Important**: This application collects sensitive location data. Please ensure:

1. **Legal Compliance**: Only track devices with explicit consent
2. **Data Protection**: Implement proper security measures in production
3. **User Notification**: Always inform users that their location will be tracked
4. **Access Control**: Add authentication to prevent unauthorized access
5. **HTTPS**: Use SSL/TLS certificates in production
6. **Data Retention**: Implement data deletion policies

### Recommended Security Enhancements for Production:

```javascript
// Add authentication middleware
app.use('/api', requireAuth);

// Encrypt sensitive data
const crypto = require('crypto');

// Use environment variables
require('dotenv').config();

// Rate limiting
const rateLimit = require('express-rate-limit');

// Database instead of file storage
// Use PostgreSQL, MongoDB, etc.
```

## 🌐 Deployment Options

### Option 1: Standalone HTML (No Server)
Use `location-tracker.html` - works entirely in the browser but doesn't store data on a server.

### Option 2: Cloud Deployment
- **Heroku**: Easy deployment with free tier
- **AWS EC2**: More control, scalable
- **Vercel/Netlify**: For serverless deployment
- **DigitalOcean**: Simple droplets

### Option 3: Self-Hosted
- Run on Raspberry Pi
- Local network server
- VPS hosting

## 📱 Mobile Considerations

- Modern mobile browsers support geolocation API
- iOS requires user interaction before requesting location
- Android may require additional permissions
- Works in Chrome, Safari, Firefox mobile browsers

## 🔄 API Endpoints

### POST `/api/create-tracker`
Create a new tracking link
```json
{
  "name": "Tracker Name"
}
```

### POST `/api/location/:trackingId`
Submit location data
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 20,
  "timestamp": "2024-02-06T10:30:00Z",
  "deviceInfo": { ... }
}
```

### GET `/api/location/:trackingId`
Retrieve location data for a tracker

### GET `/api/trackers`
Get all trackers and their locations

## 🛠️ Customization

### Changing Port
Edit `server.js`:
```javascript
const PORT = 3000; // Change to your desired port
```

### Styling
Modify the CSS in HTML files to match your brand colors:
```css
background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
```

### Map Provider
Replace Google Maps with alternatives:
- OpenStreetMap
- Mapbox
- Leaflet

## 🐛 Troubleshooting

**Location not working?**
- Check browser permissions
- Ensure HTTPS (required for geolocation on most browsers)
- Verify geolocation is enabled on device

**Server not starting?**
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`
- Check for missing dependencies: `npm install`

**Data not saving?**
- Ensure write permissions in project directory
- Check server logs for errors
- Verify API URL matches server address

## 📈 Future Enhancements

- [ ] Real-time location updates (WebSockets)
- [ ] Geofencing and alerts
- [ ] Location history timeline
- [ ] Export data to CSV/JSON
- [ ] Multi-user authentication
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Mobile app version
- [ ] Encrypted data transmission
- [ ] Battery level monitoring
- [ ] Movement speed and direction

## 📄 License

MIT License - feel free to use for personal or commercial projects

## ⚠️ Disclaimer

This software is provided for legitimate tracking purposes only (e.g., finding lost devices, family safety, delivery tracking). Users are responsible for ensuring legal compliance and obtaining proper consent before tracking any device or individual.

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## 📞 Support

For issues or questions, please open an issue on the project repository.

---

**Note**: Always prioritize user privacy and comply with local laws regarding location tracking and data collection.
