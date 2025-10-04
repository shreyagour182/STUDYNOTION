const nodemailer = require("nodemailer");
require('dotenv').config();

const mailSender = async (email, title, body) => {
    try{
        console.log('Setting up SendGrid transporter...');
            let transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: 587,
                secure: false,
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
            })
           
            // Send email asynchronously and log outcome
            transporter.sendMail({
                // CRITICAL FIX: Use the verified email address directly.
                from: `StudyNotion || CodeHelp - by Shreya <${process.env.MAIL_SENDER_EMAIL}>`,
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
