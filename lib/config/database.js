import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    
    isConnected = true;
    console.log(' MongoDB Connected');
    
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    throw new Error('Database connection failed');
  }
}