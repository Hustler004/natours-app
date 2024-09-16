const AppError = require('../utils/appErorrs');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  //   const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const message = `Duplicate field value ${err.keyValue.name} : please use another value`;
  console.log(message);
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data, ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJsonWebTokenError = () => {
  return new AppError('Invalid token. Please login again', 401);
};
const handleJWTExpiredError = () =>
  new AppError('Token expired! Please login again', 401);
const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDERED WEBSITE
  console.error('ERROR: ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      //operational, trusted error: send message to the client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //1. log error
    console.error('ERROR: ', err);
    //2) Send general message
    //programming or other unknown error: don't leak error details
    return res.status(500).json({
      status: 'error',
      message: 'Something went very very wrong!',
    });
  }
  //RENDERED WEBSITE
  if (err.isOperational) {
    //operational, trusted error: send message to the client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  //programming or other unknown error: don't leak error details
  //1. log error
  console.error('ERROR: ', err);
  //2) Send general message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
