const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const {paymentSuccessEmail} = require("../mail/templates/paymentSuccessEmail")
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");

// Helper function to enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    console.error("Missing courses or userId in enrollStudents");
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }

  const studentId = new mongoose.Types.ObjectId(userId); // Convert once for consistency

  for (const courseId of courses) {
    try {
      // 1. Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: studentId } }, // Use studentId (ObjectId)
        { new: true }
      )

      if (!enrolledCourse) {
        console.error(`Course not found for ID: ${courseId}`);
        return res
          .status(500)
          .json({ success: false, error: "Course not found for enrollment" })
      }
      console.log("Updated course: ", enrolledCourse.courseName);

      // 2. Create Course Progress Record
      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: studentId, // Use studentId (ObjectId)
        completedVideos: [],
      })
     
      // 3. Find the student and update their courses and progress (run concurrently with email)
      const enrolledStudent = await User.findById(userId);

      if (!enrolledStudent) {
        console.error(`User not found for ID: ${userId} during enrollment`);
        // This is a critical error, but we return status 500
        return res.status(500).json({ success: false, error: "Student not found for progress update" });
      }


      // Run both the user update and the email send concurrently
      await Promise.all([
        User.findByIdAndUpdate(
          userId,
          {
            $push: {
              courses: courseId,
              courseProgress: courseProgress._id,
            },
          },
          { new: true }
        ),
        // Send an email notification to the enrolled student
        mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        )
      ]);

      console.log(`Enrollment and Email successful for course ${courseId}`);

    } catch (error) {
      console.error("Enrollment Error in loop:", error);
      return res.status(400).json({ success: false, error: `Error enrolling in course ${courseId}: ${error.message}` })
    }
  }
}


// Capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
  const { courses } = req.body
  const userId = req.user.id
  if (courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" })
  }

  let total_amount = 0

  for (const course_id of courses) {
    let course
    try {
      // Find the course by its ID
      course = await Course.findById(course_id)

      // If the course is not found, return an error
      if (!course) {
        return res
          .status(200)
          .json({ success: false, message: "Could not find the Course" })
      }

      // Check if the user is already enrolled in the course
      const uid = new mongoose.Types.ObjectId(userId)
      if (course.studentsEnrolled.includes(uid)) {
        return res
          .status(200)
          .json({ success: false, message: "Student is already Enrolled in one of the courses" })
      }

      // Add the price of the course to the total amount
      total_amount += course.price
    } catch (error) {
      console.error("Error calculating total amount:", error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  const options = {
    amount: total_amount * 100, // Amount in paise
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  }

  try {
    // Initiate the payment using Razorpay
    const paymentResponse = await instance.orders.create(options)
    console.log("Razorpay Order Created:", paymentResponse.id)
    res.json({
      success: true,
      data: paymentResponse,
    })
  } catch (error) {
    console.error("Error initiating Razorpay order:", error)
    res
      .status(500)
      .json({ success: false, message: "Could not initiate order. Check Razorpay keys." })
  }
}

// verify the payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id
  const razorpay_payment_id = req.body?.razorpay_payment_id
  const razorpay_signature = req.body?.razorpay_signature
  const courses = req.body?.courses

  const userId = req.user.id

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    console.error("Payment verification failed: Missing required fields.");
    return res.status(200).json({ success: false, message: "Payment Failed: Missing data." })
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id

  // CRITICAL: Ensure process.env.RAZORPAY_KEY_SECRET is correct and accessible here
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    // Payment is verified, proceed to enroll students
    console.log("Razorpay Signature Verified. Proceeding to enrollment.");
    await enrollStudents(courses, userId, res)
    // enrollStudents sends the response, but we add a final safety response just in case
    return res.status(200).json({ success: true, message: "Payment Verified and Enrollment Initiated" })
  }

  console.error("Payment Signature Mismatch. Expected:", expectedSignature, "Received:", razorpay_signature);
  return res.status(200).json({ success: false, message: "Payment Failed: Invalid Signature" })
}

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body

  const userId = req.user.id

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details for success email" })
  }

  try {
    const enrolledStudent = await User.findById(userId)

    await mailSender(
      enrolledStudent.email,
      `Payment Received - Course Enrollment`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100, // Convert from paise back to Rupees for the email
        orderId,
        paymentId
      )
    )
    return res.status(200).json({ success: true, message: "Payment Success Email Sent" });
  } catch (error) {
    console.error("Error in sending Payment Success Email:", error)
    return res
      .status(500)
      .json({ success: false, message: "Could not send payment success email" })
  }
}
