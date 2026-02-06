// config.js - Configuration file for Location Tracker

module.exports = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Data storage
    storage: {
        type: 'file', // Options: 'file', 'database'
        filePath: './location-data.json'
    },

    // Security settings
    security: {
        enableAuth: false, // Set to true in production
        apiKey: process.env.API_KEY || null,
        corsOrigins: ['*'], // Restrict in production
        rateLimitRequests: 100,
        rateLimitWindowMs: 15 * 60 * 1000 // 15 minutes
    },

    // Location tracking settings
    tracking: {
        enableHighAccuracy: true,
        timeout: 10000, // milliseconds
        maximumAge: 0, // milliseconds
        autoRefreshInterval: 10000 // Dashboard refresh interval
    },

    // Feature flags
    features: {
        enableIPTracking: true,
        enableDeviceInfo: true,
        enableMapEmbedding: true,
        enableExport: true
    },

    // UI customization
    ui: {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        appName: 'Location Tracker',
        favicon: '/favicon.ico'
    }
};
