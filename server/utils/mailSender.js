const nodemailer = require("nodemailer");
require('dotenv').config();

const mailSender = async (email, title, body) => {
    try{
        console.log('Setting up secure transporter (Port 465)...'); // Updated log
            let transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: 465, // <-- SWITCHING TO SECURE SSL PORT
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
                secure: true, // <-- SETTING TO TRUE FOR PORT 465
                // tls block removed as it's not needed for standard secure connection
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

            // No return here, as the outer controller is set to proceed without waiting.
    }
    catch(error) {
        console.error("FATAL ERROR IN TRANSPORTER SETUP:", error);
    }
}

module.exports = mailSender;
