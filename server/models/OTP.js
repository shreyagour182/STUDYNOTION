const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
 type: String,
 required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Document automatically deleted after 5 minutes
    expires: 60 * 5,
  },
});

// Helper function to send email
async function sendVerificationEmail(email, otp) {
  try {
    // Assume mailSender returns a successful response object
    const mailResponse = await mailSender(
      email,
      "Verification Code from EdTech Platform",
      emailTemplate(otp) // Assuming emailTemplate function exists and formats the HTML
    );

    if (mailResponse && mailResponse.response) {
      console.log("Verification Email sent successfully: ", mailResponse.response);
    } else {
      console.log("Verification Email was created but no successful response from mail server.");
    }

  } catch (error) {
    // If email sending fails, log the error and allow the model save to fail/continue
    console.error("Error occurred while sending verification mail: ", error.message);
    throw new Error("Failed to send verification email.");
  }}

// Pre-save hook to send email before document is saved
OTPSchema.pre("save", async function (next) {
  // Only send an email when a new document is created
  if (this.isNew) {
    try {
      await sendVerificationEmail(this.email, this.otp);
    } catch (error) {
      // Pass the error to Mongoose to halt the save process
      return next(error);
    }
  }
  next();
});

const OTP = mongoose.model("OTP", OTPSchema);
module.exports = OTP;
