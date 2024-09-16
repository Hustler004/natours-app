const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErorrs');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NOD_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirmed: req.body.passwordConfirmed,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  // await new Email(newUser, url).sendWelcome();

  //creating jwt token here...with id as payload, secret key defined in our config.env, and expiresIn will logout the user in defined amount of time
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //the below code is same as getting req.body.email and req.body.password differently and saving them into the variables defined
  const { email, password } = req.body;

  // 1. check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide eail and password!', 400));
  }
  //2. check if user exists and password is correct
  //below code is same as User.findOne({ email:email }); but if the fields are same in es6 we can write like this as well!
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // console.log(user);
  //3. if everything ok, send token to the client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1. getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access.', 401),
    );
  }
  //2. verify the token
  // console.log(token);
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. check if user still exists
  const currentUser = await User.findById(decoded.id);
  // console.log(decoded);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer exists', 401),
    );
  }
  //4. check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password: Please login again!!', 401),
    );
  }
  //GRANT access to the protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
//usually we don't pass arguments in middleware, but if we really want to then we have to make a wrapper function and then call the middleware right away, this wrapper function is also known as closure
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // console.log('here');
  //1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  //2. generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3. send it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2. Set new password only if token has not expired
  if (!user) {
    return next(new AppError('token is invalid or has expired!', 400));
  }
  user.password = req.body.password;
  user.passwordConfirmed = req.body.passwordConfirmed;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //we don't do validate false here because we want to validate if the user has sent correct passwod and email address or not
  await user.save();
  //3. update changedPasswordAt property for the user
  //---this step is taken care of in userModel-userSchema.pre 2nd middleware
  //4. log the user in, i.e send JWT to the client
  createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // console.log('yo yo');
  //1 get user from the collection
  // console.log(req);
  const user = await User.findById(req.user.id).select('+password');
  //2 check if the posted password is corrected

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect password', 401));
  }
  //3 if the password is correct then update the password
  user.password = req.body.password;
  user.passwordConfirmed = req.body.passwordConfirmed;
  await user.save();
  //always remember we cant use user.findbyidandupdate here because the validator doesn't work and also none of the pre-save middleware work so any update related to passwords we have to do with .save() only
  //4 log the user in , send JWT
  createSendToken(user, 200, res);
});

//only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  //1. getting token and check if it's there
  if (req.cookies.jwt) {
    try {
      //1. verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      //2. check if user still exists
      const currentUser = await User.findById(decoded.id);
      // console.log(decoded);
      if (!currentUser) {
        return next();
      }
      //3. check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //THERE IS A LOGGED IN USER
      res.locals.user = currentUser; //this puts currentUser on user local which can be used in pug templates
      return next();
    } catch (err) {
      return next();
    }
  }
  return next();
};

//400 - bad request
//401 - unauthorized access
//404 - page not found
//200 - success
//201 - created successfully
//204 - deleted successfully
//500 - internal server error
