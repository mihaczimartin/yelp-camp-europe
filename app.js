if (process.env.NODE_ENV !== "production") {
	require("dotenv").config();
}

// Connect Express, Mongoose, ejs-Mate, Method Override, Sessions, Passport.

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/yelp-camp";

// Require the security packages.

const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

// Set up the error handling functions.

const ExpressError = require("./utils/ExpressError");

// Connect with the express Router.

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

// Main function to write errors in the console.

main().catch((err) => console.log(err));

// Mongoose's method to connect with the Mongo database.

async function main() {
	await mongoose.connect(mongoUrl);
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
	console.log("Database connected");
});

// Define variable for Express.

const app = express();

// Set the default ejs engine to ejs-mate for easier templating.

app.engine("ejs", ejsMate);

// Set the path for ejs pages.

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// Define how method override will be used.

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Security middlewares for Mongo injection and HTTP headers.

app.set("trust proxy", 1);

app.use(mongoSanitize());

const scriptSrcUrls = [
	"https://stackpath.bootstrapcdn.com/",
	"https://api.tiles.mapbox.com/",
	"https://api.mapbox.com/",
	"https://kit.fontawesome.com/",
	"https://cdnjs.cloudflare.com/",
	"https://cdn.jsdelivr.net",
	"https://m-yelp-camp-europe.onrender.com/"
];
const styleSrcUrls = [
	"https://kit-free.fontawesome.com/",
	"https://cdn.jsdelivr.net",
	"https://api.mapbox.com/",
	"https://api.tiles.mapbox.com/",
	"https://fonts.googleapis.com/",
	"https://use.fontawesome.com/",
	"https://m-yelp-camp-europe.onrender.com/"
];
const connectSrcUrls = [
	"https://api.mapbox.com/",
	"https://a.tiles.mapbox.com/",
	"https://b.tiles.mapbox.com/",
	"https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: [],
			connectSrc: ["'self'", ...connectSrcUrls],
			scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
			styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
			workerSrc: ["'self'", "blob:"],
			objectSrc: [],
			imgSrc: [
				"'self'",
				"blob:",
				"data:",
				"https://res.cloudinary.com/dgnqblwsg/",
				"https://images.unsplash.com/",
			],
			fontSrc: ["'self'", ...fontSrcUrls],
		},
	})
);

// Connect with the public static assets directory.

app.use(express.static(path.join(__dirname, "public")));

// Configure sessions and set up flash.

const secret = process.env.SECRET || "thisisasecret";

const store = MongoStore.create({
	mongoUrl: mongoUrl,
	touchAfter: 24 * 60 * 60,
	crypto: {
		secret,
	},
});

store.on("error", function (e) {
	console.log("SESSION STORE ERROR");
});

const sessionConfig = {
	store,
	name: "season",
	secret,
	resave: false,
	saveUninitialized: true,
	cookie: {
		// According to OWASP, this setting should be explicit for security reasons.
		httpOnly: true,
		secure: true,
		// Expires after one week counting in milliseconds.
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
};
app.use(session(sessionConfig));
app.use(flash());

// Configure passport. AFTER sessions.

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Define flash middleware BEFORE any route handlers.

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});

// Use the campground routes that was connected above.

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

// Render home page.

app.get("/", (req, res) => {
	res.render("home");
});

// HTTP 404 status code, error handling.

app.all("*", (req, res, next) => {
	next(new ExpressError("Page Not Found!", 404));
});

// Error handling middleware for async functions.

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = "Oh no, something went wrong!";
	res.status(statusCode).render("error", { err });
});

// This will connect the app to the specified location..

const port = process.env.PORT || 8060;

app.listen(port, () => {
	console.log(`Serving on port ${port}.`);
});
