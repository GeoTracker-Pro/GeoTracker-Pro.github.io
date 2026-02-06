#!/bin/bash

# Location Tracker Setup Script

echo "🚀 Setting up Location Tracker Service..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Create public directory
echo "📁 Creating public directory..."
mkdir -p public

# Move HTML files to public directory
echo "📄 Moving HTML files..."
cp tracker.html public/ 2>/dev/null || echo "tracker.html already in place"
cp dashboard.html public/ 2>/dev/null || echo "dashboard.html already in place"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Start the server: npm start"
echo "   2. Open your browser to: http://localhost:3000"
echo "   3. Create a tracking link and share it!"
echo ""
echo "📖 For more information, see README.md"
echo ""
