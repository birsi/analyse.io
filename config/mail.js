/**!
 * analyse.io
 *
 * mail.js
 * Mail server configuration
 * Sets up the SMTP configuration for nodemailer
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

module.exports = {
    config: {
        host: "smtp.birsak.org",
        name: "birsak.org",
        auth: {
            user: "smtp@birsak.org",
            pass: "1337@2344"
        }
    }
};