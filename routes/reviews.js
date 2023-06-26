const express = require("express");
const router = express.Router({ mergeParams: true });
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");

// Connect with the node app with the database models and controllers.

const reviews = require("../controllers/reviews");

// Set up the error handling functions.

const catchAsync = require("../utils/catchAsync");

// Setting up the review route.

router.post("/", isLoggedIn, validateReview, catchAsync(reviews.createReview));

// Deleting reviews. Delete reference for campground and the actual review.

router.delete(
	"/:reviewId",
	isLoggedIn,
	isReviewAuthor,
	catchAsync(reviews.deleteReview)
);

module.exports = router;
