// ============================================
// feedback.controller.js - Feedback Controller
// ============================================

import Feedback from '../models/Feedback.model.js';

export const createFeedback = async (req, res, next) => {
  try {
    const { rating, feedback, name, email } = req.body;

    const parsedRating = Number(rating);
    if (!rating || isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required and must be between 1 and 5.',
      });
    }

    if (!feedback || typeof feedback !== 'string' || !feedback.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback message is required.',
      });
    }

    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }
    }

    const feedbackDoc = await Feedback.create({
      rating: parsedRating,
      feedback: feedback.trim(),
      name: name && typeof name === 'string' ? name.trim() : '',
      email: email && typeof email === 'string' ? email.trim() : '',
      user: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedbackDoc,
    });
  } catch (error) {
    next(error);
  }
};
