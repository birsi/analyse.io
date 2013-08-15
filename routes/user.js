/**!
 * analyse.io
 *
 * user.js
 * Configuration of all user routes
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *   Module dependencies
 **/
var auth = require('./authorization.js');

/**
 *   User routes
 **/
module.exports = function(app, passport, userController) {

    // User get routes
    app.get('/signup', userController.signup);
    app.get('/login', userController.login);
    app.get('/logout', userController.logout);
    app.get('/delete', auth.isAuthenticated, userController.delete);
    app.get('/forgot_password', userController.forgot_password);
    app.get('/reset_password/:token', userController.reset_password);
    app.get('/profile', auth.isAuthenticated, userController.profile);
    app.get('/auth/twitter', passport.authenticate('twitter'));
    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/login'
    }));

    // User post routes
    app.post('/signup', userController.create);
    app.post('/login',
        passport.authenticate('local', {
            successRedirect: '/profile',
            failureRedirect: '/login',
            failureFlash: true })
    );
    app.post('/profile', userController.update);
    app.post('/forgot_password', userController.forgot_password);
    app.post('/reset_password', userController.reset_password);

};