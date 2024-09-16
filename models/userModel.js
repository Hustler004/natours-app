const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'user name is required'],
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    required: [true, 'user email is required'],
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minLength: 8,
    select: false,
  },
  passwordConfirmed: {
    type: String,
    required: [true, 'confirm your password'],
    validate: {
      // this only works on CREATE and SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now(),
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//encrypt password
userSchema.pre('save', async function (next) {
  //only want to encrypt password if password field is being updated
  if (!this.isModified('password')) return next();
  //curr pw is set to encryped version with a salting = cost of 12 (cpu effort required to hash the pw)
  this.password = await bcrypt.hash(this.password, 12);
  //we don't want passwordConfirmed as such after validating that the user has input the same
  this.passwordConfirmed = undefined;
  next();
});
userSchema.pre('save', async function (next) {
  //if we didn't modify our password property or the doc is new then we dont want to manipulate the passwordChangedAt property as well and we return out of this function
  if (!this.isModified('password') || this.isNew) return next();
  // console.log('m bhi hu');
  //sometimes the token is issued before this passwordChangedAt property is updated so it is better to subtract 1s while setting it
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  //"this" keyword points to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    // console.log(JWTTimeStamp, changedTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  }
  //false means not changedb
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
//SOME JWT THOERY HERE:
//JWT is JSON WEB TOKEN which we are using for stateless identification of the user being loggedin or not in our system
//if user is not logged in he shouldn't get any access to the protected data
//so how does this work is there in the photo but how does JWT work is defined below
//JWT consists of 3 parts payload+header+secret , so the payload and header from the encoded string and the secret string is saved on the server that together forms the signature
//HEADER: header is just a metadata about the token itself
//PAYLOAD: data we want to encode in the token(any data that we want)
//singning algo takes header+payload and secret from server forms signature and then together HEADER,PAYLOAD AND SIGNATURE are together sent as JWT token to the client
//once the server receives JWT how it'll verify: 1. JWT is received 2. takes header and payload and with a secret string it has creates a test signature that can be checked with JWT signature if both are same
