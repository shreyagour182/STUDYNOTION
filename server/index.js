

const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors"); // if you want your backend to entertain the request of frontend , so for this we nees CORS
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
// Loading environment variables from .env file
dotenv.config();

// Setting up port number
const PORT = process.env.PORT || 5001;


// Connecting to database
database.connect();

// Middlewares
app.use(express.json());
app.use(cookieParser());
// app.use(
// 	cors({
// 		origin: "http://localhost:3000",
// 		credentials: true,
// 	})
// );

const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://studynotion-theta-gules.vercel.app", // Deployed frontend
];

app.use(
  cors({
      origin: allowedOrigins,
      credentials: true,
  })
);

// Handle preflight requests (important for some requests like login)
app.options("*", cors());

app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);

// Connecting to cloudinary
cloudinaryConnect();

// Setting up routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running ...",
	});
});

// Listening to the server
app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});

// End of code.
