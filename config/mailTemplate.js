/**!
 * analyse.io
 *
 * mailTemplate.js
 * Defines all mail templates for notifications
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

module.exports =  {

    /**
     *  Sends the password notification email to the user containing a unique password reset toke
     **/
    passwordNotification : function(user, token) {
        return {
            from: "Michael Birsak - analyse.io<mb@analyse.io>",
            to: user.email,
            subject: "Your analyse.io password",
            text: "Reset you analyse.io password: http://dev.birsak.net/reset_password/" + token,
            html:   "Hello dear analye.io user!<p>To reset you analyse.io password click <a href='http://dev.birsak.net/reset_password/" + token + "'>here</a></p>" +
                    "<p>Thank you, and have a good day!<br><br>Greetings, <b>analyse.io</b></p>"
        };
    }
};