import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tracker from '@/models/Tracker';

// POST - Add location to a tracker (public endpoint for tracking)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { trackerId, latitude, longitude, accuracy, timestamp, deviceInfo, ip } = await request.json();

    if (!trackerId) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }

    const tracker = await Tracker.findOne({ trackerId, isActive: true });

    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found or inactive' },
        { status: 404 }
      );
    }

    // Add location data
    const locationData = {
      latitude,
      longitude,
      accuracy: accuracy || 0,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      deviceInfo,
      ip,
    };

    tracker.locations.push(locationData);
    await tracker.save();

    return NextResponse.json({
      success: true,
      message: 'Location recorded successfully',
      locationCount: tracker.locations.length,
    });
  } catch (error) {
    console.error('Record location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
