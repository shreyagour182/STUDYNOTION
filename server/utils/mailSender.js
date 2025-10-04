const nodemailer = require("nodemailer");
require('dotenv').config();

const mailSender = async (email, title, body) => {
    try{
        console.log('Setting up transporter...');
            let transporter = nodemailer.createTransport({
                // Nodemailer को पोर्ट 587 (STARTTLS) का उपयोग करने के लिए सेट करें
                host: process.env.MAIL_HOST,
                port: 587,          // <--- STARTTLS के लिए पोर्ट 587 सेट करें
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
                secure: false,      // <--- secure: false का मतलब है STARTTLS का उपयोग करना
                tls: {
                    ciphers: 'SSLv3'
                }
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
        // Log the full error for debugging in Render logs
        console.error("MAIL SENDER ERROR: The email could not be delivered.", error);
        console.error("Nodemailer Message:", error.message);
    }
}

module.exports = mailSender;
