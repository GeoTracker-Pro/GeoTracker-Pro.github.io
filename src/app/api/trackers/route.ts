import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tracker from '@/models/Tracker';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

// GET all trackers for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // If admin, get all trackers; otherwise, get only user's trackers
    const query = payload.role === 'admin' ? {} : { createdBy: payload.userId };
    const trackers = await Tracker.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      trackers,
    });
  } catch (error) {
    console.error('Get trackers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new tracker
export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Tracker name is required' },
        { status: 400 }
      );
    }

    // Generate unique tracker ID
    const trackerId = 'track_' + crypto.randomUUID();

    const tracker = await Tracker.create({
      trackerId,
      name,
      createdBy: payload.userId,
      locations: [],
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      tracker,
    }, { status: 201 });
  } catch (error) {
    console.error('Create tracker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
