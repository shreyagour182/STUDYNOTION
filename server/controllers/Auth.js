const bcrypt = require('bcryptjs');
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();

// Signup Controller for Registering USers

exports.signup = async (req, res) => {
  try {
    // Data fetch from the request body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType = "Student", // Defaulting accountType for safety
      contactNumber,
      otp,
    } = req.body;
   
    // 1. Check if All Details are there or not
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All Fields are required",
      });
    }
   
    // 2. Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match. Please try again.",
      });
    }

    // 3. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      });
    }

    // 4. Find the most recent, valid OTP for the email
    const recentOTP = await OTP.findOne({ email }).sort({ createdAt: -1 }).exec();

    if (!recentOTP) {
      // OTP not found or has expired (due to TTL index)
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired. Please re-send.",
      });
    }
   
    if (otp !== recentOTP.otp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    // 5. OTP Verified - Delete the OTP entry to prevent reuse
    await OTP.deleteMany({ email }); // Delete all OTP records for this email

    // 6. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Set Approval Status and Create Profile in parallel (Minor performance gain)
    const approved = accountType === "Instructor" ? false : true;

    // Create the Additional Profile For User
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null, // Note: You might want to use the 'contactNumber' from req.body here
    });

    // 8. Create DB entry for user
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType: accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
      });
     }
   catch (error) {
    console.error("SIGNUP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

// Login controller for authenticating users
exports.login = async (req, res) => {
	try {
		// Get email and password from request body
		const { email, password } = req.body;
		console.log("Received login request for email:", email);

		// Check if email or password is missing
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Please fill in all the required fields",
			});
		}

		// Find user by email (populate additional details if necessary)
		const user = await User.findOne({ email }).populate("additionalDetails");

		// If user does not exist
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User is not registered. Please sign up to continue.",
			});
		}
		console.log("User found:", user);

		// Check if password exists in the database
		if (!user.password) {
			return res.status(401).json({
				success: false,
				message: "User does not have a password set. Try resetting it.",
			});
		}

		// Compare passwords
		const isPasswordCorrect = await bcrypt.compare(password, user.password);
		if (!isPasswordCorrect) {
			console.log("Incorrect password attempt.");

			return res.status(401).json({
				success: false,
				message: "Incorrect password. Please try again.",
			});
		}

		// Generate JWT token
		const token = jwt.sign(
			{ email: user.email, id: user._id, accountType: user.accountType },
			process.env.JWT_SECRET,
			{ expiresIn: "24h" }
		);
		console.log("Token generated:", token);

		// Save token in the user document (Optional)
		user.token = token;
		user.password = undefined; // Hide password in response

		// Set cookie options
		const options = {
			expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
			httpOnly: true,
		};

		// Send success response with cookie
		res.cookie("token", token, options).status(200).json({
			success: true,
			token,
			user,
			message: "User login successful",
		});
	} catch (error) {
		console.error("LOGIN ERROR:", error.message || error);
		return res.status(500).json({
			success: false,
			message: "Login failed. Please try again later.",
		});
	}
};

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user is already present
    const checkUserPresent = await User.findOne({ email });
   
    if (checkUserPresent) {
      // User is already registered
      return res.status(401).json({
        success: false,
        message: `User is Already Registered. Please login.`,
      });
    }

    // --- OTP Generation with Collision Check (Fixed for infinite loop) ---
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    let result = await OTP.findOne({ otp: otp });
    // Re-generate OTP if a duplicate is found (this is safer)
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp }); // CRITICAL: Must update 'result'
    }

    // Create OTP entry. This action automatically triggers the OTPSchema.pre('save') hook
    // defined in models/OTP.js to send the verification email.
    const otpPayload = { email, otp };

    // *** PERFORMANCE FIX: Remove AWAIT here to prevent blocking ***
    // We intentionally do not await the database operation. The response is sent immediately,
    // and the email is handled asynchronously by the Mongoose 'pre' hook.
    OTP.create(otpPayload)
        .then(() => console.log("OTP Body created, email hook triggered successfully."))
        .catch((err) => console.error("Error creating OTP for email hook:", err.message));

    // Return response IMMEDIATELY
    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully (Check your inbox and spam folder)`,
    });
  }
  catch (error) {
    console.error("SEND OTP ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Could not send OTP. Please try again." });
  }
};


// Controller for Changing Password
exports.changePassword = async (req, res) => {
	try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		// Match new password and confirm new password
		// if (newPassword !== confirmNewPassword) {
		// 	// If new password and confirm new password do not match, return a 400 (Bad Request) error
		// 	return res.status(400).json({
		// 		success: false,
		// 		message: "The password and confirm password does not match",
		// 	});
		// }

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};
