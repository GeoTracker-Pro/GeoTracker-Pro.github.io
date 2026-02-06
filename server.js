// server.js - Backend server to receive location data
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store location data (in production, use a database)
const dataFile = path.join(__dirname, 'location-data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
}

// Generate unique tracking ID
function generateTrackingId() {
    return 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Endpoint to create a new tracking link
app.post('/api/create-tracker', (req, res) => {
    const trackingId = generateTrackingId();
    const trackerData = {
        id: trackingId,
        created: new Date().toISOString(),
        name: req.body.name || 'Unnamed Tracker',
        locations: []
    };

    // Read existing data
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    data.push(trackerData);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    res.json({
        success: true,
        trackingId: trackingId,
        trackingUrl: `http://localhost:${PORT}/track/${trackingId}`
    });
});

// Endpoint to receive location data
app.post('/api/location/:trackingId', (req, res) => {
    const { trackingId } = req.params;
    const locationData = {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        accuracy: req.body.accuracy,
        timestamp: req.body.timestamp,
        deviceInfo: req.body.deviceInfo,
        ip: req.ip
    };

    // Read existing data
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const tracker = data.find(t => t.id === trackingId);

    if (tracker) {
        tracker.locations.push(locationData);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Location saved' });
    } else {
        res.status(404).json({ success: false, message: 'Tracker not found' });
    }
});

// Endpoint to retrieve location data
app.get('/api/location/:trackingId', (req, res) => {
    const { trackingId } = req.params;
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const tracker = data.find(t => t.id === trackingId);

    if (tracker) {
        res.json({ success: true, data: tracker });
    } else {
        res.status(404).json({ success: false, message: 'Tracker not found' });
    }
});

// Endpoint to get all trackers (for dashboard)
app.get('/api/trackers', (req, res) => {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    res.json({ success: true, trackers: data });
});

// Serve tracking page
app.get('/track/:trackingId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracker.html'));
});

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Location tracker server running on http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
});
