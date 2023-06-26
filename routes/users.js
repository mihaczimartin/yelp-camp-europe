const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const { storeReturnTo } = require("../middleware");
const users = require("../controllers/users");

// This is the basic show route for the register page.
// This is where it actually registers a new users. We flash the error message on the actual registering page.

router
	.route("/register")
	.get(users.readRegister)
	.post(catchAsync(users.createUser));

// This is the basic show route for the login page.
// This is where the actual logging in is implemented.

router
	.route("/login")
	.get(users.readLogIn)
	.post(
		storeReturnTo,
		passport.authenticate("local", {
			failureFlash: true,
			failureRedirect: "/login",
		}),
		users.logInUser
	);

// This where the logging out is implemented.

router.get("/logout", users.logOutUser);

module.exports = router;
