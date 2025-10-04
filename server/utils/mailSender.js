const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// SendGrid API Key को सीधे SDK में सेट करें
sgMail.setApiKey(process.env.MAIL_PASS);

// MAIL_SENDER_EMAIL वेरिएबल से FROM एड्रेस सेट करें
const SENDER_EMAIL = process.env.MAIL_SENDER_EMAIL;

const mailSender = async (email, title, body) => {
    // अगर Sender Email सेट नहीं है, तो तुरंत लौट जाएँ
    if (!SENDER_EMAIL) {
        console.error("FATAL: MAIL_SENDER_EMAIL is not set in environment variables.");
        return;
    }

    // ईमेल बनाने के लिए SendGrid के फॉर्मेट का उपयोग करें
    const msg = {
        to: email,
        from: SENDER_EMAIL, // CRITICAL: यह SendGrid में Verified Email होना चाहिए
        subject: title,
        html: body,
    };

    try {
        console.log('Attempting to send email via SendGrid HTTP API...');

        // HTTP API कॉल
        await sgMail.send(msg);

        console.log("Email sent successfully via SendGrid API.");
        return true;

    } catch (error) {
        console.error("==========================================");
        console.error("SENDGRID HTTP API FAILED:");

        // SendGrid API से विशिष्ट त्रुटियाँ (जैसे Authentication, Forbidden) प्राप्त करें
        if (error.response) {
            console.error("Status:", error.response.statusCode);
            console.error("Body:", JSON.stringify(error.response.body));
        } else {
            console.error("Error:", error.message);
        }

        console.error("==========================================");
        // OTP body बनाने वाले फंक्शन को यह सुनिश्चित करने के लिए रिटर्न करें कि HTTP 200 गया हो
        return false;
    }
};

module.exports = mailSender;
