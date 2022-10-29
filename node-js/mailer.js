var nodemailer = require('nodemailer');
var logger = require('./logger.js');

var config = {
    host: 'smtp.office365.com',//smtp.office365.com
    secureConnection: true,//enable tls
    port: 587,
    auth: {
        user: 'user',
        pass: 'password'
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
    }
}


module.exports = {
    init: function (configData) {
        config = configData;
    },
    sendEmail: function (to, subject, text, callback) {
        var transporter = nodemailer.createTransport(config);
        var mailOptions = {
            from: configFile.notify.mail,
            to: to,
            // cc:"",
            // bcc:"",
            subject: subject,
            text: text
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                logger.error("mailer.js", "Error during the send of the email ERROR: " + error);
                callback(false)
            } else {
                callback(true)
            }
        });
    }
};