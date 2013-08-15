/**!
 * analyse.io
 *
 * userController.js
 * User controller
 * Definition of all user methods
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var mongoose = require('mongoose'),
    utility = require('../lib/utility'),
    mailConfig = require('../config/mail'),
    mailTemplate = require('../config/mailTemplate'),
    nodemailer = require('nodemailer'),
    User = mongoose.model('User');

/**
 *  Configure nodemailer
 *  https://github.com/andris9/nodemailer
 **/
var smtpTransport = nodemailer.createTransport("SMTP", mailConfig.config);


/**
 *  User controller object
 **/
module.exports = {

    login: function(req, res) {

        // Check if user is already logged in
        if (req.session.passport.user) {
            return res.redirect('/profile');
        }

        res.render('user/login', {
            title: 'Login',
            message: req.flash('error')
        });
    },

    logout: function(req, res) {
        req.logout();
        res.redirect('/');
    },

    signup: function(req, res) {
        var user = new User();
        res.render('user/signup', {
            title: 'Sign up',
            user: new User()
        });
    },

    create: function(req, res) {

        var user = new User(req.body);
        user.provider = 'local';

        user.save(function(err) {
            console.log("Trying to save");
            if (err) {
                return res.render('user/signup', {
                    errors: utility.errorHelper(err),
                    user: user,
                    title: 'Sign up'
                });
            }

            req.logIn(user, function(err) {
                console.log('Trying to login');
                if (err) return next(err);
                return res.redirect('/profile');
            });
        });

    },

    /**
     * update
     *
     * Updates a user, but doesn't use mongoose's update method
     * because then the validation middlework wouldn't work.
     * It tries to find the user and save the new values.
     */
    update: function(req, res, next) {

        var userRaw = req.user;
        var id = req.user.id;
        var userEdited = req.body;

        User
            .findOne({
                _id: id
            })
            .exec(function(err, user) {
                if (err) return next(err);
                if (!user) return next(new Error('Failed to load User ' + id));

                // Fields to update
                user.name = userEdited.name;
                if (userEdited.password !== '' && user.provider === 'local') {
                    user.password = userEdited.password;
                }

                user.save(function(err) {
                    if (err) {
                        console.log(err);
                        return res.render('user/profile', {
                            errors: utility.errorHelper(err),
                            user: userRaw,
                            title: 'Profile'
                        });
                    }
                    req.flash('info', 'Your profile was updated');
                    console.log("User updated!");
                    return res.redirect('/profile');
                });
            });

    },

    forgot_password: function(req, res, next) {

        // POST request
        if (req.method === 'POST') {
            var email = req.body.email;
            // Find user by email
            User
                .findOne({
                    email: email
                })
                .exec(function(err, user) {
                    if (err) return next(err);

                    if (!user) {
                        req.flash('info', 'There is no user with this email');
                        return res.redirect('/forgot_password');
                    }

                    // Create a token and store it in the database
                    user.createPasswordResetToken(function(err, token) {
                        user.save(function(err) {
                            if (err) {
                                console.log(err);
                            }

                            // Define the email content
                            var mailOptions = mailTemplate.passwordNotification(user, token);

                            // Send the email
                            smtpTransport.sendMail(mailOptions, function(error, response) {
                                if (error) {
                                    console.log(error);
                                    req.flash('info', 'There was a problem with your email adress');
                                    return res.redirect('/forgot_password');
                                } else {
                                    console.log("Message sent: " + response.message);
                                    // Set the flash message
                                    req.flash('info', 'You will receive an email shortly');
                                    // If everything is successful render the page
                                    return res.render('user/forgot_password', {
                                        title: 'Forgot password',
                                        messages: req.flash('info'),
                                        success: 'true'
                                    });
                                }
                            });

                        });
                    });
                });

        } else {
            // GET request
            res.render('user/forgot_password', {
                title: 'Forgot password',
                messages: req.flash('info'),
                success: 'false'
            });
        }

    },

    reset_password: function(req, res, next) {

        // POST request
        if (req.method === 'POST') {

            if (!req.body._resetToken ||
                req.body._resetToken.length === 0) return next(new Error('There is no token!'));

            var token = req.body._resetToken,
                password = req.body.password;


            // Find user by password reset token
            User
                .findOne({
                    passwordResetToken: token
                })
                .exec(function(err, user) {
                    if (err) return next(err);
                    if (!user) {
                        req.flash('info', 'The password token is invalid');
                        return res.redirect('/forgot_password');
                    }

                    // Set the new password
                    user.password = password;

                    // Clear the tokenDate and the token
                    user.passwordResetDate = null;
                    user.passwordResetToken = null;

                    // Save the new password
                    user.save(function(err) {
                        // On error, render the page again and display the errors
                        if (err) {
                            console.log(err);
                            return res.render('user/reset_password', {
                                errors: utility.errorHelper(err),
                                user: user,
                                token: token,
                                title: 'Reset password'
                            });
                        }

                        // If successful log the user in
                        req.logIn(user, function(err) {
                            console.log('Trying to login');
                            if (err) return next(err);
                            return res.redirect('/profile');
                        });
                    });
                });

        } else {
            // GET request
            if (!req.params.token) return next(new Error('There is no token!'));

            var passwordToken = req.params.token;

            // Find user by password reset token
            User
                .findOne({
                    passwordResetToken: passwordToken
                })
                .exec(function(err, user) {
                    if (err) return next(err);

                    // If there is no user with the token display error message
                    if (!user) {
                        req.flash('info', 'The password token is invalid');
                        return res.redirect('/forgot_password');
                    }

                    // Verify the token date (max.livetime = 24h)
                    var dateNow = new Date();
                    var tokenDate = user.passwordResetDate;

                    console.log(dateNow);
                    console.log(tokenDate);

                    if ((tokenDate + 1) < dateNow) {
                        // The token is outdated, redirect the user to reset his password again
                        req.flash('info', 'Error: The token is outdated and not valid anymore.');
                        return res.redirect('/forgot_password');
                    } else {
                        // Token is valid, now render the so that the user can change his password
                        return res.render('user/reset_password', {
                            title: 'New password',
                            user: user,
                            token: passwordToken
                        });
                    }

                });
        }

    },

    delete: function(req, res, next) {

        var user = req.user;
        var id = req.user.id;

        User
            .findOne({
                _id: id
            })
            .exec(function(err, user) {
                if (err) return next(err);
                if (!user) return next(new Error('Failed to find User ' + id));

                // Remove the user
                user.remove(function(err) {
                    if (err) return next(err);
                    console.log("The user " + id + " was removed");
                    return res.redirect('/');
                });
            });

    },

    profile: function(req, res) {

        var user = req.user;

        res.render('user/profile', {
            title: 'Profile',
            user: user,
            messages: req.flash('info')
        });
    }

};