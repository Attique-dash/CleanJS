import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import User from '../../../../lib/models/User';
import sendMail from '../../../../lib/utils/sendMail.js';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    await connectDB();
    
    const usersFilePath = path.join(process.cwd(), 'lib/data/users.json');
    
    if (!fs.existsSync(usersFilePath)) {
      return NextResponse.json({
        success: false,
        message: 'Users data file not found'
      }, { status: 404 });
    }

    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    let syncedUsers = 0;
    let errors = [];

    for (const userData of usersData) {
      try {
        if (!userData.username || !userData.email || !userData.password) {
          errors.push(`Skipped user: Missing required fields`);
          continue;
        }

        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email.toLowerCase() },
            { username: userData.username }
          ]
        });
        
        if (!existingUser) {
          const newUser = new User({
            username: userData.username.trim(),
            email: userData.email.toLowerCase().trim(),
            password: userData.password
          });

          await newUser.save();
          
          try {
            await sendMail(userData.email, userData.username);
          } catch (emailError) {
            console.warn(`Email failed for ${userData.username}`);
          }

          syncedUsers++;
          console.log(` Synced: ${userData.username}`);
        }

      } catch (userError) {
        errors.push(`Failed to sync ${userData.username}: ${userError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. ${syncedUsers} users synced.`,
      syncedCount: syncedUsers,
      errors: errors.length > 0 ? errors : null
    }, { status: 200 });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Sync operation failed' },
      { status: 500 }
    );
  }
}