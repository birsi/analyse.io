/**!
 * analyse.io
 *
 * authorization.js
 * Defines authorization and authentication middleware for areas which require a login
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *   Authorization object
 **/
module.exports = {

    /**
     * General authentication method to check if the request is authorized
     * https://github.com/jaredhanson/passport-local/blob/master/examples/express3-mongoose/app.js
     **/
    isAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            req.flash('error', 'Please login first!');
            res.redirect('/login');
        }
    },

    /**
     *  Job specific authorizations
     **/
    job: {

        // Users can only view their own jobs
        isAuthorized: function(req, res, next) {

            if (req.job.id != req.user.id) {
                req.flash('error', 'You are not authorized to view this job');
                return res.redirect('/job/archive');
            }
            next();
        }

    }

};