import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import User from '../../../../lib/models/User';
import sendMail from '../../../../lib/utils/sendMail';

export async function POST(request) {
  try {
    console.log(' Starting registration process...');
    await connectDB();
    console.log(' Database connected');
    
    const { username, email, password } = await request.json();
    console.log(' Registration attempt:', { username, email });

    if (!username || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'All fields are required (username, email, password)' 
        },
        { status: 400 }
      );
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return NextResponse.json(
        { success: false, message: `User with this ${field} already exists` },
        { status: 400 }
      );
    }

    console.log(' Creating new user...');
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    await newUser.save();
    console.log(' User created successfully');

    // Try to send welcome email
    let emailStatus = 'Email not attempted';
    try {
      console.log(' Attempting to send welcome email...');
      const emailResult = await sendMail(email, username);
      
      if (emailResult.success) {
        emailStatus = 'Welcome email sent successfully';
        console.log(' Email sent successfully');
      } else {
        emailStatus = `Email failed: ${emailResult.error}`;
        console.warn(' Email failed:', emailResult.error);
      }
    } catch (emailError) {
      emailStatus = `Email error: ${emailError.message}`;
      console.error(' Email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully!',
      emailStatus: emailStatus,
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error(' Registration error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)[0].message;
      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}