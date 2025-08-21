import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import User from '../../../../lib/models/User';
import sendMail from '../../../../lib/utils/sendMail.js';

export async function POST() {
  try {
    console.log(' Starting sync process...');
    await connectDB();
    console.log(' Database connected');
    
    const existingUsers = await User.find({}, 'username email createdAt').sort({ createdAt: -1 });
    console.log(` Found ${existingUsers.length} existing users in database:`);
    existingUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Created: ${user.createdAt}`);
    });

    const usersData = [
      {
        "username": "James",
        "email": "james@example.com",
        "password": "123456"
      }
    ];

    console.log(` Processing ${usersData.length} users from sync data...`);

    let syncedUsers = 0;
    let skippedUsers = 0;
    let errors = [];
    const syncDetails = [];

    for (const userData of usersData) {
      try {
        console.log(` Checking user: ${userData.username} (${userData.email})`);
        
        if (!userData.username || !userData.email || !userData.password) {
          const errorMsg = `Skipped user: Missing required fields`;
          errors.push(errorMsg);
          console.warn(` ${errorMsg}`);
          syncDetails.push({
            username: userData.username || 'Unknown',
            email: userData.email || 'Unknown',
            status: 'error',
            reason: 'Missing required fields'
          });
          continue;
        }

        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email.toLowerCase() },
            { username: userData.username }
          ]
        });
        
        if (!existingUser) {
          console.log(`➕ Creating new user: ${userData.username}`);
          
          const newUser = new User({
            username: userData.username.trim(),
            email: userData.email.toLowerCase().trim(),
            password: userData.password
          });

          await newUser.save();
          console.log(` User saved: ${userData.username}`);
          
          let emailResult = { success: false, error: 'Not attempted' };
          try {
            console.log(` Sending email to: ${userData.email}`);
            emailResult = await sendMail(userData.email, userData.username);
            if (emailResult.success) {
              console.log(` Email sent to: ${userData.email}`);
            } else {
              console.warn(` Email failed for ${userData.username}:`, emailResult.error);
            }
          } catch (emailError) {
            console.warn(` Email failed for ${userData.username}:`, emailError.message);
            emailResult = { success: false, error: emailError.message };
          }

          syncedUsers++;
          syncDetails.push({
            username: userData.username,
            email: userData.email,
            status: 'created',
            emailSent: emailResult.success,
            emailError: emailResult.success ? null : emailResult.error
          });
        } else {
          console.log(` User already exists: ${userData.username} (DB ID: ${existingUser._id})`);
          skippedUsers++;
          syncDetails.push({
            username: userData.username,
            email: userData.email,
            status: 'skipped',
            reason: 'User already exists',
            existingId: existingUser._id
          });
        }

      } catch (userError) {
        const errorMsg = `Failed to sync ${userData.username}: ${userError.message}`;
        errors.push(errorMsg);
        console.error(` ${errorMsg}`);
        syncDetails.push({
          username: userData.username,
          email: userData.email,
          status: 'error',
          reason: userError.message
        });
      }
    }

    const finalUserCount = await User.countDocuments();

    const response = {
      success: true,
      message: `Sync completed. ${syncedUsers} users synced, ${skippedUsers} users skipped.`,
      database: {
        totalUsersInDatabase: finalUserCount,
        existingUsers: existingUsers.map(u => ({
          username: u.username,
          email: u.email,
          createdAt: u.createdAt
        }))
      },
      sync: {
        syncedCount: syncedUsers,
        skippedCount: skippedUsers,
        totalProcessed: usersData.length,
        details: syncDetails
      },
      errors: errors.length > 0 ? errors : null
    };

    console.log(' Sync Summary:', {
      totalInDB: finalUserCount,
      synced: syncedUsers,
      skipped: skippedUsers
    });
    
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error(' Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Sync operation failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}