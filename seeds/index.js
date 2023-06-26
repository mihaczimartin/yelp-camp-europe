const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/campground");

main().catch((err) => console.log(err));

async function main() {
	await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
	console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
	await Campground.deleteMany({});
	for (let i = 0; i < 200; i++) {
		const random152 = Math.floor(Math.random() * 152);
		const price = Math.floor(Math.random() * 30) + 10;
		const camp = new Campground({
			author: "648b64917845f58e20aee807",
			location: `${cities[random152].city}, ${cities[random152].state}`,
			title: `${sample(descriptors)} ${sample(places)}`,
			description:
				"Lorem ipsum dolor sit amet consetetur nonumy sed invidunt facer et ad augue quis velit exerci at. Labore ea eirmod dolor eos invidunt dolor vel no sit dolor dolor magna eirmod. Consetetur ipsum eum sanctus duo est sea.",
			price,
			geometry: {
				type: "Point",
				coordinates: [cities[random152].longitude, cities[random152].latitude],
			},
			images: [
				{
					url: "https://res.cloudinary.com/dgnqblwsg/image/upload/v1686943916/YelpCamp/t0tjsfgcqet3opd0rbrz.jpg",
					filename: "t0tjsfgcqet3opd0rbrz",
				},
				{
					url: "https://res.cloudinary.com/dgnqblwsg/image/upload/v1686943918/YelpCamp/iyxnomu5x63srklvoqrl.jpg",
					filename: "iyxnomu5x63srklvoqrl",
				},
			],
		});
		await camp.save();
	}
};

seedDB().then(() => {
	mongoose.connection.close();
});
