const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, `Can't post an empty review`],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
//now each combinattion of tour and user always has to be unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'user',
  //     select: 'name photo',
  //   }).populate({
  //     path: 'tour',
  //     select: 'name',
  //   });
  //the above method is not used because we didn't want to store the reviews on the tour with the information of tours
  // the chaining was created and for us here in this application specifically
  //it made more sense to not populate tours in reviews you can refactor according to your own needs
  //this is all done to minimize the populate operation as much as possible because it adds extra query and performance overhead
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].averageRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  //this points to doc currently saved
  this.constructor.calcAverageRatings(this.tour);
  //because we don't have access to the model name yet (Review) we are using this.constructor
});

//we have to also calculate these above stats for when the review is updated and deleted
//and as the query functions findByIdAndUpdate and findByIdAndDelete don't have access to the document middleware
//we can't directly call these functions like we did earlier
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this refers to the query, clone it to avoid executing twice
  this.r = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this refers to the query, but we can access the document via this.r (set in pre-hook)
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
