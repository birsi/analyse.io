/**!
 * analyse.io
 *
 * passport.js
 * Passport configuration file
 * http://passportjs.org/guide/
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *   Module dependencies
 **/
var mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    User = mongoose.model('User');

/**
 *   passport.js module
 **/
module.exports = function(app, passport, config) {

    /**
     * Configure passport sessions
     * http://passportjs.org/guide/configure/
     **/
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findOne({
            _id: id
        }, function(err, user) {
            done(err, user);
        });
    });

    /**
     * Configure a local login strategy
     * For users who don't login via Twitter, but have created an account
     * http://passportjs.org/guide/username-password/
     **/
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(email, password, done) {
        // Find the user according to the email
        User.findOne({
            email: email
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            // Display a general error message in the production environment for security reasons
            if (app.get('env' === 'production')) {
                if (!user || !user.authenticate(password)) {
                    return done(null, false, {
                        message: 'Invalid user or password'
                    });
                }
            } else {
                // Display a specific error message
                if (!user) {
                    return done(null, false, {
                        message: 'Unknown user'
                    });
                }
                if (!user.authenticate(password)) {
                    return done(null, false, {
                        message: 'Wrong password'
                    });
                }
            }

            return done(null, user);
        });
    }));

    /**
     * Configure a Twitter-based login method so that
     * users can login via a Twitter account
     * http://passportjs.org/guide/twitter/
     **/
    passport.use(new TwitterStrategy({
        consumerKey: config.twitter.clientID,
        consumerSecret: config.twitter.clientSecret,
        callbackURL: config.twitter.callbackURL
    }, function(token, tokenSecret, profile, done) {
        // Check if the user has already an account
        User.findOne({
            email: profile.id
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            // If the user uses the app for the first time, create an account
            if (!user) {
                user = new User({
                    name: profile.displayName,
                    email: profile.id,
                    provider: 'twitter',
                    twitter: profile._json
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                return done(err, user);
            }
        });
    }));

};