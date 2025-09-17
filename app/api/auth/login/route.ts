import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import User from '../../../../lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: user
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}