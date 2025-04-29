
require("dotenv").config();

const Razorpay = require("razorpay");

console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID); // Debugging
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET); // Debugging

exports.instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET
});
