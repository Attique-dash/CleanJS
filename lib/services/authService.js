import User from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendWelcomeEmail } from './notificationService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// In-memory storage for refresh tokens (in production, use Redis or database)
const refreshTokens = new Map();

// In-memory storage for rate limiting (in production, use Redis)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Generate JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Generate refresh token
 */
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check rate limiting for login attempts
 */
function checkRateLimit(identifier) {
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    return { allowed: true };
  }
  
  // Clean expired lockouts
  if (attempts.lockedUntil && attempts.lockedUntil < Date.now()) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }
  
  // Check if still locked
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    return { 
      allowed: false, 
      error: 'Account temporarily locked due to too many failed attempts',
      lockedUntil: new Date(attempts.lockedUntil)
    };
  }
  
  // Check if max attempts reached
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_TIME;
    attempts.lockedUntil = lockedUntil;
    loginAttempts.set(identifier, attempts);
    
    return { 
      allowed: false, 
      error: 'Too many failed attempts. Account locked for 15 minutes.',
      lockedUntil: new Date(lockedUntil)
    };
  }
  
  return { allowed: true };
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(identifier) {
  const attempts = loginAttempts.get(identifier) || { count: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(identifier, attempts);
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(identifier) {
  loginAttempts.delete(identifier);
}

/**
 * Register a new user
 */
export async function registerUser(userData) {
  try {
    const { username, email, password, role = 'customer' } = userData;
    
    // Validation
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('User with this email already exists');
      }
      if (existingUser.username === username) {
        throw new Error('User with this username already exists');
      }
    }
    
    // Create new user
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true
    });
    
    await user.save();
    
    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }
    
    // Generate tokens
    const accessToken = generateToken({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    const refreshToken = generateRefreshToken();
    refreshTokens.set(refreshToken, {
      userId: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login user
 */
export async function loginUser(credentials) {
  try {
    const { identifier, password } = credentials; // identifier can be email or username
    
    if (!identifier || !password) {
      throw new Error('Email/username and password are required');
    }
    
    // Check rate limiting
    const rateLimitCheck = checkRateLimit(identifier);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error);
    }
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ],
      isActive: true
    });
    
    if (!user) {
      recordFailedAttempt(identifier);
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      recordFailedAttempt(identifier);
      throw new Error('Invalid credentials');
    }
    
    // Clear failed attempts on successful login
    clearFailedAttempts(identifier);
    
    // Update last login
    user.updatedAt = new Date();
    await user.save();
    
    // Generate tokens
    const accessToken = generateToken({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    const refreshToken = generateRefreshToken();
    refreshTokens.set(refreshToken, {
      userId: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.updatedAt
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }
    
    const tokenData = refreshTokens.get(refreshToken);
    
    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }
    
    // Check if refresh token is expired
    if (tokenData.expiresAt < Date.now()) {
      refreshTokens.delete(refreshToken);
      throw new Error('Refresh token expired');
    }
    
    // Get user
    const user = await User.findById(tokenData.userId);
    
    if (!user || !user.isActive) {
      refreshTokens.delete(refreshToken);
      throw new Error('User not found or inactive');
    }
    
    // Generate new access token
    const accessToken = generateToken({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    return {
      success: true,
      accessToken,
      expiresIn: JWT_EXPIRES_IN
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

/**
 * Logout user (invalidate refresh token)
 */
export async function logoutUser(refreshToken) {
  try {
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
  try {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      user: user.toJSON()
    };
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updateData) {
  try {
    const allowedFields = ['username', 'email'];
    const updates = {};
    
    // Only allow certain fields to be updated
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Check for duplicates if email or username is being updated
    if (updates.email || updates.username) {
      const query = {
        _id: { $ne: userId },
        $or: []
      };
      
      if (updates.email) {
        query.$or.push({ email: updates.email.toLowerCase() });
      }
      
      if (updates.username) {
        query.$or.push({ username: updates.username });
      }
      
      const existingUser = await User.findOne(query);
      if (existingUser) {
        if (existingUser.email === updates.email) {
          throw new Error('Email already in use');
        }
        if (existingUser.username === updates.username) {
          throw new Error('Username already taken');
        }
      }
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      user: user.toJSON()
    };
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

/**
 * Change user password
 */
export async function changePassword(userId, passwordData) {
  try {
    const { currentPassword, newPassword } = passwordData;
    
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }
    
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
}

/**
 * Verify API token for external integrations
 */
export async function verifyApiToken(token) {
  try {
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    return {
      success: true,
      user: user.toJSON(),
      decoded
    };
  } catch (error) {
    console.error('API token verification error:', error);
    throw error;
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(options = {}) {
  try {
    const {
      page = 1,
      pageSize = 20,
      role = null,
      isActive = null,
      search = ''
    } = options;
    
    const skip = (page - 1) * pageSize;
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== null) {
      query.isActive = isActive;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { username: searchRegex },
        { email: searchRegex }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      User.countDocuments(query)
    ]);
    
    return {
      success: true,
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
}

/**
 * Deactivate user (admin only)
 */
export async function deactivateUser(userId) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Invalidate all refresh tokens for this user
    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId.toString() === userId) {
        refreshTokens.delete(token);
      }
    }
    
    return {
      success: true,
      user: user.toJSON()
    };
  } catch (error) {
    console.error('Deactivate user error:', error);
    throw error;
  }
}

/**
 * Activate user (admin only)
 */
export async function activateUser(userId) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: true } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      user: user.toJSON()
    };
  } catch (error) {
    console.error('Activate user error:', error);
    throw error;
  }
}

/**
 * Clean expired refresh tokens (should be run periodically)
 */
export function cleanExpiredTokens() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [token, data] of refreshTokens.entries()) {
    if (data.expiresAt < now) {
      refreshTokens.delete(token);
      cleaned++;
    }
  }
  
  console.log(`Cleaned ${cleaned} expired refresh tokens`);
  return cleaned;
}

/**
 * Get authentication statistics
 */
export function getAuthStats() {
  const now = Date.now();
  let activeTokens = 0;
  let expiredTokens = 0;
  
  for (const [token, data] of refreshTokens.entries()) {
    if (data.expiresAt > now) {
      activeTokens++;
    } else {
      expiredTokens++;
    }
  }
  
  return {
    activeRefreshTokens: activeTokens,
    expiredRefreshTokens: expiredTokens,
    totalRefreshTokens: refreshTokens.size,
    rateLimitedIPs: loginAttempts.size
  };
}