// Connect the error handling functions and validation schemas.

const Campground = require("./models/campground");
const Review = require("./models/review");
const { campgroundSchema, reviewSchema } = require("./schemas.js");
const ExpressError = require("./utils/ExpressError");

// Check if the user is logged in.

module.exports.isLoggedIn = (req, res, next) => {
	// console.log("REQ.USER...", req.user);
	if (!req.isAuthenticated()) {
		req.session.returnTo = req.originalUrl;
		req.flash("error", "You must be signed in first!");
		return res.redirect("/login");
	}
	next();
};

// Store session info (the currently viewed page) to locals, because passport ends the session after logging in.

module.exports.storeReturnTo = (req, res, next) => {
	if (req.session.returnTo) {
		res.locals.returnTo = req.session.returnTo;
	}
	next();
};

// Define campground validation middleware.

module.exports.validateCampground = (req, res, next) => {
	// Throw errors from the validation schema, when there are any.
	const { error } = campgroundSchema.validate(req.body);
	if (error) {
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

// Check if logged user is the author of campground, otherwise he shouldn't be able to modify it.

module.exports.isAuthor = async (req, res, next) => {
	const { id } = req.params;
	const campground = await Campground.findById(id);
	if (!campground.author.equals(req.user._id)) {
		req.flash("error", "You do not have permission to do that!");
		return res.redirect(`/campgrounds/${id}`);
	}
	next();
};

// Define review validation middleware.

module.exports.validateReview = (req, res, next) => {
	const { error } = reviewSchema.validate(req.body);
	if (error) {
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

// Check if logged user is the author of review, otherwise he shouldn't be able to modify it.

module.exports.isReviewAuthor = async (req, res, next) => {
	const { id, reviewId } = req.params;
	const review = await Review.findById(reviewId);
	if (!review.author.equals(req.user._id)) {
		req.flash("error", "You do not have permission to do that!");
		return res.redirect(`/campgrounds/${id}`);
	}
	next();
};
