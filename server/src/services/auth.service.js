// ============================================
// auth.service.js - Authentication Service
// ============================================
// Business logic for registration, login,
// Google OAuth, and user profile retrieval.
// ============================================

import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { verifyGoogleToken } from '../config/google.config.js';
import { generateToken } from '../utils/jwt.utils.js';

import mongoose from 'mongoose';

const checkDbConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database connection unavailable. Please check your MongoDB connection or Atlas IP whitelist.');
    error.statusCode = 503;
    throw error;
  }
};

export const register = async (name, rawEmail, password) => {
  checkDbConnection();
  const email = (rawEmail || '').toLowerCase().trim();

  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10); // bcrypt password hashing (Express.js: Authentication)
  const user = await User.create({ name, email, password: hashedPassword });
  const token = generateToken(user); // JWT token generation (Express.js: Authentication)

  return {
    token,
    user: { id: user._id, email: user.email, name: user.name, picture: user.picture },
  };
};

export const emailLogin = async (rawEmail, password) => {
  checkDbConnection();
  const email = (rawEmail || '').toLowerCase().trim();

  const user = await User.findOne({ email });
  if (!user || !user.password) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password); // bcrypt password comparison (Express.js: Authentication)
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();
  const token = generateToken(user);

  return {
    token,
    user: { id: user._id, email: user.email, name: user.name, picture: user.picture },
  };
};

export const googleLogin = async (credential) => {
  checkDbConnection();

  // ── 1. Verify Google ID token ───────────────────────────────────────────
  console.log('[Auth:BE] Verifying Google ID token with google-auth-library');
  const googleUser = await verifyGoogleToken(credential);
  const email = (googleUser.email || '').toLowerCase().trim();
  console.log('[Auth:BE] Google user information received:', { email, googleId: googleUser.googleId });

  // ── 2. Database lookup ─────────────────────────────────────────────────
  console.log('[Auth:BE] Database lookup for googleId or email:', email);
  let user = await User.findOne({
    $or: [
      { googleId: googleUser.googleId },
      { email },
    ],
  });

  // ── 3. User creation / update ──────────────────────────────────────────
  if (user) {
    console.log('[Auth:BE] Existing user found — updating Google profile data', { userId: user._id.toString() });
    user.googleId = googleUser.googleId;
    user.email = email;
    user.name = googleUser.name || user.name;
    user.picture = googleUser.picture || user.picture;
    user.lastLogin = new Date();
    await user.save();
    console.log('[Auth:BE] User updated in database');
  } else {
    console.log('[Auth:BE] No existing user — creating new user for', email);
    user = await User.create({
      googleId: googleUser.googleId,
      email,
      name: googleUser.name,
      picture: googleUser.picture,
      lastLogin: new Date(),
    });
    console.log('[Auth:BE] New user created', { userId: user._id.toString() });
  }

  // ── 4. JWT generation ──────────────────────────────────────────────────
  const token = generateToken(user);
  console.log('[Auth:BE] JWT token created successfully for user:', user._id.toString());

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-__v -googleId');

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
};
