const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapBoxToken });

// TODO A fixed sized of all images should be rendered on all read/show pages! Using cloudinary's image transfrom api.

module.exports.readIndex = async (req, res) => {
	const campgrounds = await Campground.find({});
	res.render("campgrounds/index", { campgrounds });
};

module.exports.readNew = (req, res) => {
	res.render("campgrounds/new");
};

// TODO only a maximum of 10 images allowed per campground. This should be applied to updateCampground also!

// TODO make sure you can't create a campground without at least ONE image.

// TODO if no data was sent from Geocode, flash a message like "No such place found. Please give a valid location."

module.exports.createCampground = async (req, res) => {
	const geoData = await geocodingClient
		.forwardGeocode({
			query: req.body.campground.location,
			limit: 1,
		})
		.send();
	const campground = new Campground(req.body.campground);
	campground.geometry = geoData.body.features[0].geometry;
	campground.images = req.files.map((f) => ({
		url: f.path,
		filename: f.filename,
	}));
	campground.author = req.user._id;
	await campground.save();
	req.flash("success", "Successfully made a new campground!");
	res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.readCampground = async (req, res) => {
	const campground = await Campground.findById(req.params.id)
		.populate({ path: "reviews", populate: { path: "author" } })
		.populate("author");
	if (!campground) {
		req.flash("error", "Campground doesn't exist or we cannot find it!");
		return res.redirect("/campgrounds");
	}
	res.render("campgrounds/show", { campground });
};

module.exports.readEditCampground = async (req, res) => {
	const { id } = req.params;
	const campground = await Campground.findById(id);
	if (!campground) {
		req.flash("error", "Campground doesn't exist or we cannot find it!");
		return res.redirect("/campgrounds");
	}
	res.render("campgrounds/edit", { campground });
};

// TODO make sure you can't update campground so that no image is present!

module.exports.updateCampground = async (req, res) => {
	const { id } = req.params;
	const campground = await Campground.findByIdAndUpdate(id, {
		...req.body.campground,
	});
	const imgs = req.files.map((f) => ({
		url: f.path,
		filename: f.filename,
	}));
	campground.images.push(...imgs);
	await campground.save();
	if (req.body.deleteImages) {
		for (let filename of req.body.deleteImages) {
			await cloudinary.uploader.destroy(filename);
		}
		await campground.updateOne({
			$pull: { images: { filename: { $in: req.body.deleteImages } } },
		});
	}
	req.flash("success", "Successfully updated campground!");
	res.redirect(`/campgrounds/${campground._id}`);
};

// TODO when deleting campground, the images should also be deleted.

module.exports.deleteCampground = async (req, res) => {
	const { id } = req.params;
	await Campground.findByIdAndDelete(id);
	req.flash("success", "Successfully deleted your campground!");
	res.redirect("/campgrounds");
};
