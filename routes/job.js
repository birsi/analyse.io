/**!
 * analyse.io
 *
 * job.js
 * Configuration of all job routes
 *
 * @author Michael Birsak
 * @date 11/08/2013
 **/

/**
 *   Module dependencies
 **/
var auth = require('./authorization.js');

/**
 *   Job routes
 **/
module.exports = function(app, passport, jobController) {

    // Job get routes
    app.get('/analyse', auth.isAuthenticated, jobController.analyse)

};