// ============================================
// Feedback.model.js - Feedback Database Schema
// ============================================

import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    feedback: {
      type: String,
      required: [true, 'Feedback message is required'],
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
