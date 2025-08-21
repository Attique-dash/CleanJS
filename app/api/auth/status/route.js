import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import User from '../../../../lib/models/User';

export async function GET() {
  try {
    await connectDB();
    
    const totalUsers = await User.countDocuments();
    const users = await User.find({}, 'username email createdAt isActive role')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      database: {
        totalUsers: totalUsers,
        users: users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
          role: user.role,
          createdAt: user.createdAt
        }))
      }
    }, { status: 200 });

  } catch (error) {
    console.error(' Database status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch database status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}