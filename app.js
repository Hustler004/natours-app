const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appErorrs');
const globalErrorHandler = require('./controllers/errorController');

//start express app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) global middlewares

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Set security HTTP headers
// app.use(helmet());

// Development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//this limiter will only allow 100 request from the same IP in an hour for security purpose
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//body parser , reading data from the body into req.body
app.use(express.json({ limit: '10Kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//middleware important when data is sent in post method...to attach data to req variable
// app.use((req, res, next) => {
//   console.log('hello from middleware');
//   next();
// });

//Data sanitsation against NoSQL query injection
//it looks at the req body , req query string and req params and removes all the $ signs
app.use(mongoSanitize());

//Data sanitsation against cross site scripting attacks(XSS)
//protects from malicious html code
app.use(xss());

//prevents paramater pollution(multiple values for single parameter- remember sort function?)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
//2) route handlers

// app.get('/api/v2/tours', getAllTours);
// app.get('/api/v2/tours/:id', getTour);
// app.post('/api/v2/tours', createTour);
// app.patch('/api/v2/tours/:id', updateTour);
// app.delete('/api/v2/tours/:id', deleteTour);
//3) routes
app.use('/', viewRouter);
app.use('/api/v2/tours', tourRouter);
app.use('/api/v2/users', userRouter);
app.use('/api/v2/reviews', reviewRouter);

//handles unhandles routes used * to handle all the other routes
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't fin ${req.originalUrl} on the server`,
  // // });
  // const err = new Error(`can't fin ${req.originalUrl} on the server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`can't find ${req.originalUrl} on the server`, 404));
});
//specifying 4 parameters express knows it is a error handling middleware
// error from the above next() function will be passed to below use function and globalErrorHandler will be called to return it into the json format
app.use(globalErrorHandler);

module.exports = app;
