import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// POST - Initialize with admin user (only works if no users exist)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check if any users exist
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'System already initialized. Users exist.' },
        { status: 400 }
      );
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Create admin user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check if system needs initialization
export async function GET() {
  try {
    await connectDB();

    const userCount = await User.countDocuments();

    return NextResponse.json({
      initialized: userCount > 0,
      userCount,
    });
  } catch (error) {
    console.error('Init check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
