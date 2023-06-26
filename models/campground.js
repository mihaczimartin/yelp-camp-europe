// Connect the campground model with mongoose and the review model.

const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
	url: String,
	filename: String,
});

// Use Cloudinary's image transformation api and the replace regexp, to get a smaller version of the image.

ImageSchema.virtual("thumbnail").get(function () {
	return this.url.replace("/upload", "/upload/w_200");
});

// Set the schema for the campgrounds in the database.
// Nested schemas with ImageSchema inside CampgroundSchema.

const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema(
	{
		title: String,
		images: [ImageSchema],
		geometry: {
			type: {
				type: String,
				enum: ["Point"],
				required: true,
			},
			coordinates: {
				type: [Number],
				required: true,
			},
		},
		price: Number,
		description: String,
		location: String,
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		reviews: [
			{
				type: Schema.Types.ObjectId,
				ref: "Review",
			},
		],
	},
	opts
);

// This is the popup text on the map of the index page.

CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
	return `
		<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
		<p>${this.description.substring(0, 30)}...</p>`;
});

// What if a campgrounds have reviews and the whole campground is deleted?
// Here is the solution! Mongoose query middleware to delete them.

CampgroundSchema.post("findOneAndDelete", async function (doc) {
	if (doc) {
		await Review.deleteMany({
			_id: {
				$in: doc.reviews,
			},
		});
	}
});

module.exports = mongoose.model("Campground", CampgroundSchema);
