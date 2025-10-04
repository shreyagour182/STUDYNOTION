const nodemailer = require("nodemailer");
require('dotenv').config();

// ye setup hai for sending mails , ab isko as a function use krenge OTP vale schema k under
const mailSender = async (email, title, body) => {
    try{
        console.log('Setting up transporter...');
            let transporter = nodemailer.createTransport({
                host:process.env.MAIL_HOST,
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
                // Note: secure: true uses port 465. If you need port 587, use secure: false and port: 587
                secure: true,
            })
            console.log('Sending email...');
            let info = await transporter.sendMail({
                from: 'StudyNotion || CodeHelp - by Shreya',
                to: `${email}`, // list of receivers
                subject: `${title}`, // Subject line
                html: `${body}`,
            })
            console.log("Email sent successfully. Info:", info);
            return info;
    }
    catch(error) {
        // Log the full error object for detailed debugging in Render logs
        console.error("MAIL SENDER ERROR:", error);
        console.error("Nodemailer Message:", error.message);
    }
}

module.exports = mailSender;
