// const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/appErorrs');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else
    cb(new AppError('Not and image! Please upload only images', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

//for single -
// upload.single('image');-> this will produces req.file

//if we had multiple images to upload and only one field to upload them in then it is better to use
// upload.array('images', 5);-> this will produce req->files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1. cover image

  //we are trying to put the data on the req here because the update one function updates all the data that is there in the req.body
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2. Images
  req.body.images = [];
  //as we are using forEach loop the async await only will not be able to stop the code
  // from moving onto the next function so we map all the promises into an array
  //and then we can later resolve all the promises by promise.all() from the array of promises that is created by the map function
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
  console.log(req.body);
  next();
});

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`tour id is ${val}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   console.log(req.body);
//   if ('name' in req.body && 'price' in req.body) {
//     next();
//   } else {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid data',
//     });
//   }
// };
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
//all the functions are wrapped in catchAsync function to catch error and remove the use of try and catch block again and again

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // console.log(req.query);
//   //BUILD QUERY
//   //1A) FILTERING
//   // const queryObj = { ...req.query }; // in js if we normally assign queryObj = req.query
//   // then it will just create a reference to the variable req.query
//   //and therefore any changes done further in the latter will effect it,
//   // therefor we will first destructure it using '...'
//   //then wrapping the req.query inside {} to make it an object again
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // excludedFields.forEach((el) => delete queryObj[el]);
//   // console.log(req.query, queryObj);
//   //1B.) ADVANCED FILTERING
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//   // console.log(JSON.parse(queryStr));
//   // let query = Tour.find(JSON.parse(queryStr));

//   //2) sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   // console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }
//   //3) FIELD LIMITING
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   // }
//   //4) PAGENATION
//   // const page = req.query.page * 1 || 1;
//   // const limitVal = req.query.limit * 1 || 100;
//   // const skipVal = (page - 1) * limitVal;
//   // page=2&limit=10, 1-10 = page 1, 11-20 = page 2 and so on
//   // query = query.skip(skipVal).limit(limitVal);
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skipVal >= numTours) throw new Error('this page does not exist');
//   // }
//   //EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .pagination();

//   const tours = await features.query;

//   //SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });
// exports.getTour = catchAsync(async (req, res, next) => {
//   // console.log('here');
//   //this will throw a mongoose error which is not operational so because it is not operational it wouldn't give very useful
//   //information to users in production side so this is handled alag se by err.name === 'casterror' waali line in errorController
//   //the populate function fills up the guides detail of the respective guides
//   const tour = await Tour.findById(req.params.id).populate({
//     path: 'reviews',
//     select: 'review rating user createdAt',
//   });
//   // console.log('here');
//   //find by id function is same as if we do manually by typing Tour.findOne({_id:req.params.id})
//   if (!tour) {
//     return next(new AppError('No tour with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
//   // const tour = tours.find((el) => el.id === id);
//   // res.status(200).json({
//   //   status: 'success',
//   //   data: {
//   //     tour,
//   //   },
//   // });
// });
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        //for each of the document that will go throught this pipeline 1 will be added to the num
        //variable that's how it stores the count of number of tours
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //deconstructs given array of each documents and then outputs document for each element of the array
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
// /tours-within/233/center/90,45/unit/mi
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlong, unit } = req.params;
  const [lat, lng] = latlong.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  // console.log(radius);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlong, unit } = req.params;
  const [lat, lng] = latlong.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  let multiplier;
  if (unit === 'mi') multiplier = 0.000621371;
  else multiplier = 0.001;
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
