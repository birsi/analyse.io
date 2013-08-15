/**!
 * analyse.io
 *
 * index.js
 * Configuration of index routes
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *   Index routes
 **/
module.exports = function(app) {

    // Application index
    app.get('/', function(req, res) {

        // Check if user is already logged in
        if(req.session.passport.user) {
             return res.redirect('/profile');
        }

        res.render('index/index', {
            title: 'analyse.io'
        });
    });

};