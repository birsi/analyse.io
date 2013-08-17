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
    app.get('/job/list', auth.isAuthenticated, jobController.list);
    app.get('/job/create', auth.isAuthenticated, jobController.create);
    app.get('/job/archive', auth.isAuthenticated, jobController.archive);
    app.get('/job/archive/view/:jobId', auth.isAuthenticated, jobController.archiveView);
    app.get('/job/archive/delete/:jobId', auth.isAuthenticated, jobController.archiveDelete);
    app.get('/job/save/:workerId', auth.isAuthenticated, jobController.save);
    app.get('/job/delete/:workerId', auth.isAuthenticated, jobController.delete);
    app.get('/job/view/:workerId', auth.isAuthenticated, jobController.view);
    app.get('/job/getJSON/:workerId', auth.isAuthenticated, jobController.getJSON);

    // Job post routes
    app.post('/job/create', auth.isAuthenticated, jobController.create);

};