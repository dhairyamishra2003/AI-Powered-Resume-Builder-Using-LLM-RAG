// ============================================
// error.middleware.js - Global Error Handling
// ============================================

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  let statusCode = err.statusCode;
  let message = err.message || 'Something went wrong on the server.';
  let code = err.code || 'SERVER_ERROR';

  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum allowed file size is 10MB.';
    }
  } else if (!statusCode) {
    statusCode = 500;
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};
