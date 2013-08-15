/**!
 * analyse.io
 *
 * app.js
 * Main application setup
 * Initializes the app and all dependend configurations
 *
 * @author Michael Birsak
 * @date 05/08/2013
 **/

/**
 *   Module dependencies
 **/
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, {log: true}),
    passport = require('passport'),
    mongoose = require('mongoose'),
    colors = require('colors');

/**
 *    Define environment & config
 **/
var environment = process.env.NODE_ENV || 'development',
    config = require('./config/config')[environment];

/**
 *   Establish MongoDB connection
 **/
mongoose.connect(config.db.host, {
    user: config.db.user,
    pass: config.db.pass
});

/**
 *   Include models
 **/
var modelsPath = __dirname + '/models/';
require(modelsPath + 'user');
require(modelsPath + 'job');

/**
 *   Setup controllers
 **/
var controllersPath = __dirname + '/controllers/',
    userController = require(controllersPath + 'userController');
    jobController = require(controllersPath + 'jobController')(io, config);

/**
 *   Include passport auth config
 */
require('./config/passport')(app, passport, config);

/**
 *   Include express config
 **/
require('./config/express')(app, passport, config);

/**
 *   Include application routes
 **/
var routesPath = __dirname + '/routes/';
require(routesPath + 'index')(app);
require(routesPath + 'user')(app, passport, userController);
require(routesPath + 'job')(app, passport, jobController);

/**
 *   Application startup
 **/
server.listen(app.get('port'), function() {
    console.log('\n-----------------------------------------------\n'.rainbow +
                'Analyse.io is up and running on port '.bold.green + 80 + '\n' +
                '-----------------------------------------------\n'.rainbow);
});

