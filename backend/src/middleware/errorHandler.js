import mongoose from 'mongoose';

function mapValidationMessage(error) {
  const firstError = Object.values(error.errors || {})[0];
  return firstError?.message || 'Validation failed';
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: mapValidationMessage(error),
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid farmer ID',
    });
  }

  if (error.code === 11000) {
    const duplicatedField = Object.keys(error.keyPattern || error.keyValue || {})[0];
    const message =
      duplicatedField === 'nationalId'
        ? 'National ID / NIC already exists'
        : `${duplicatedField || 'Value'} already exists`;

    return res.status(409).json({
      success: false,
      message,
    });
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Server error' : error.message,
  });
}

