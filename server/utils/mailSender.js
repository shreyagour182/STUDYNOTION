const nodemailer = require("nodemailer");
require('dotenv').config();

// यह फंक्शन अब SendGrid के SMTP होस्ट, यूजरनेम और पोर्ट का उपयोग करता है
const mailSender = async (email, title, body) => {
    try{
        console.log('Setting up SendGrid transporter...');
            let transporter = nodemailer.createTransport({
                // SendGrid Host
                host: process.env.MAIL_HOST,
                // SendGrid uses port 587 with STARTTLS
                port: 587,
                secure: false,
                auth:{
                    // SendGrid requires the username to be 'apikey'
                    user: process.env.MAIL_USER,
                    // The password must be the actual SendGrid API Key
                    pass: process.env.MAIL_PASS,
                },
            })
           
            // Send email asynchronously and log outcome
            transporter.sendMail({
                from: 'StudyNotion || CodeHelp - by Shreya',
                to: `${email}`,
                subject: `${title}`,
                html: `${body}`,
            })
            .then(info => console.log("Email sent successfully (Async). Info:", info))
            .catch(error => {
                console.error("==========================================");
                console.error("MAIL SENDER FAILED. Connection or Auth Error:");
                console.error("==========================================");
                console.error(error.message);
                console.error(error);
            });

    }
    catch(error) {
        console.error("FATAL ERROR IN TRANSPORTER SETUP:", error);
    }
}

module.exports = mailSender;
