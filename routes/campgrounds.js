const express = require("express");
const router = express.Router();
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware");

// Connect with the node app with the database models and controllers.

const campgrounds = require("../controllers/campgrounds");

// Connect with multer and Cloudinary to set up the file uploading path.

const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

// Set up the error handling functions.

const catchAsync = require("../utils/catchAsync");

// Main campgrounds page.
// The new campground is added to the campgrounds page here.

router
	.route("/")
	.get(catchAsync(campgrounds.readIndex))
	.post(
		isLoggedIn,
		upload.array("image"),
		validateCampground,
		catchAsync(campgrounds.createCampground)
	);

// Add new campground page.

router.get("/new", isLoggedIn, campgrounds.readNew);

// View a specific campground. Also, populate it with relevant reviews and authors..
// Here is the actual editing done.
// Delete the specified campground.

router
	.route("/:id")
	.get(catchAsync(campgrounds.readCampground))
	.put(
		isLoggedIn,
		isAuthor,
		upload.array("image"),
		validateCampground,
		catchAsync(campgrounds.updateCampground)
	)
	.delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

// Edit the specified campground page.

router.get(
	"/:id/edit",
	isLoggedIn,
	isAuthor,
	catchAsync(campgrounds.readEditCampground)
);

module.exports = router;
