/**!
 * analyse.io
 *
 * express.js
 * Express configuration file
 * http://expressjs.com/api.html
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var express = require('express'),
    flash = require('connect-flash'),
    engine = require('ejs-locals'),
    mongoose = require('mongoose'),
    mongoStore = require('connect-mongo')(express);

/**
 *  express.js module
 **/
module.exports = function(app, passport, config) {

    app.engine('ejs', engine);

    app.set('port', process.env.PORT || 80);
    app.set('views', config.rootPath + '/views');
    app.set('view engine', 'ejs');
    app.set('showStackError', true);

    app.use(express.compress({
        filter: function(req, res) {
            return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 9
    }));

    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('analysesecretio'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(config.rootPath + '/public/'));

    // Save the express session in the MongoDB
    app.use(express.session({
        secret: 'analyseiosecrettest',
        store: new mongoStore({
            url: config.db,
            collection: 'sessions',
            auto_reconnect: true
        })
    }));

    // Use passport's session
    app.use(passport.initialize());
    app.use(passport.session());

    // Use connect-flash for flash messages
    app.use(flash());

    // Enable Cross-Site Request Forgery support
    // http://sporcic.org/2012/10/csrf-with-nodejs-and-express-3/
    if (process.env.NODE_ENV !== 'test') {
        app.use(express.csrf());
    }

    // Expose the token in res.locals so it can be used in templates
    app.use(function(req, res, next) {
        res.locals.csrf_token = req.session._csrf;
        next();
    });

    // Middleware function to expose the user name to all views
    app.use(function(req,res,next){
        if(typeof req.user !== 'undefined') {
            res.locals.userLoggedIn = req.user;
        }
        next();
    });

    app.use(app.router);

    // Development configuration
    // Use express error handler & format the html output with new lines
    app.configure('development', function() {
        app.use(express.errorHandler());
        app.locals.pretty = true;
    });

};