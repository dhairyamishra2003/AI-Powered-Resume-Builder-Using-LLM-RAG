// ============================================
// feedbackService.js - Feedback API Service
// ============================================

import API from './api.js';

export const submitFeedback = async ({ rating, feedback, name, email }) => {
  const payload = {
    rating: Number(rating),
    feedback: feedback.trim(),
    name: name ? name.trim() : '',
    email: email ? email.trim() : '',
  };

  const response = await API.post('/feedback', payload);
  return response;
};
