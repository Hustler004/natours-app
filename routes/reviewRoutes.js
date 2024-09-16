const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

//by default each router ony has access to parameter of their specific routes but here in post route there is no tour id but we still want get acceess to the tour id which is in different router so to get access to the tourId from the previous router we set mergeParams: true
const router = express.Router({ mergeParams: true });

//POST /tour/905348934fjrefjrg/reviews
//GET /tour/905348934fjrefjrg/reviews
//POST /reviews
router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  );
module.exports = router;
