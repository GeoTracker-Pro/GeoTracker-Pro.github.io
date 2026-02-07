import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tracker from '@/models/Tracker';
import { getUserFromRequest } from '@/lib/auth';

// GET single tracker by trackerId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const tracker = await Tracker.findOne({ trackerId: id });

    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tracker,
    });
  } catch (error) {
    console.error('Get tracker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE tracker
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const tracker = await Tracker.findOne({ trackerId: id });

    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    // Check if user owns this tracker or is admin
    if (
      payload.role !== 'admin' &&
      tracker.createdBy.toString() !== payload.userId
    ) {
      return NextResponse.json(
        { error: 'Not authorized to delete this tracker' },
        { status: 403 }
      );
    }

    await Tracker.deleteOne({ trackerId: id });

    return NextResponse.json({
      success: true,
      message: 'Tracker deleted successfully',
    });
  } catch (error) {
    console.error('Delete tracker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update tracker
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const { name, isActive } = await request.json();

    const tracker = await Tracker.findOne({ trackerId: id });

    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    // Check if user owns this tracker or is admin
    if (
      payload.role !== 'admin' &&
      tracker.createdBy.toString() !== payload.userId
    ) {
      return NextResponse.json(
        { error: 'Not authorized to update this tracker' },
        { status: 403 }
      );
    }

    if (name) tracker.name = name;
    if (typeof isActive === 'boolean') tracker.isActive = isActive;

    await tracker.save();

    return NextResponse.json({
      success: true,
      tracker,
    });
  } catch (error) {
    console.error('Update tracker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
