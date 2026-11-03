import mongoose from 'mongoose';

export const isValidResumeId = (resumeId) => {
  if (typeof resumeId !== 'string' || !mongoose.Types.ObjectId.isValid(resumeId)) {
    return false;
  }

  return new mongoose.Types.ObjectId(resumeId).toString() === resumeId.toLowerCase();
};

export const invalidResumeIdError = () => {
  const error = new Error('Invalid Resume ID');
  error.statusCode = 400;
  return error;
};

export const validateResumeId = (req, res, next, resumeId) => {
  if (!isValidResumeId(resumeId)) {
    return res.status(400).json({ success: false, message: 'Invalid Resume ID' });
  }

  return next();
};
