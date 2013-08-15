/**!
 * analyse.io
 *
 * jobController.js
 * Job controller
 * Definition of all job methods
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var mongoose = require('mongoose'),
    utility = require('../lib/utility'),
    AnalyseStorage = require('../lib/analyseStorage'),
    Twit = require('twit'),
    async = require('async'),
    senti = require('sentiment'),
    Job = mongoose.model('Job');
    User = mongoose.model('User');

/**
 *  Job controller class
 **/
module.exports = function(io, config) {

    // Set up the AnalyseStorage object
    storage = new AnalyseStorage();

    // Set up the Twitter stream
    var tweet = new Twit({
        consumer_key: config.twitter.clientID,
        consumer_secret: config.twitter.clientSecret,
        access_token: config.twitter.accessToken,
        access_token_secret: config.twitter.accessTokenSecret,
    });

    var stream = tweet.stream('statuses/filter', {
        locations: [-0.351468299999965 , 51.38494009999999 , 0.14787969999997586 , 51.6723432]
    });

    // Twitter stream handling
    stream.on('tweet', function(tweet) {

        // Check if there are workers in the storage
        if(storage.getWorkers().length > 0){
            var workers = storage.getWorkers();

            // Iterate all workers of the storage asynchronously to handle the worker of each user
            async.each(workers, function(item, callback) {

                // Check if the worker has timed out (Every worker has a 48hour lifetime)
                if(item.validateTimeout() === true) {

                    // Emit the new status (Worker timed out)
                    io.sockets.in(item.user).emit('statusChanged', storage.getWorker(item.user).getStatus());

                    // Delete the worker if timed out and create a new empty worker
                    storage.deleteWorker(item.user);
                    storage.createWorker(item.user);

                    return false;
                }

                // Check if the worker is active
                if(item.active === true) {

                    // Check if the worker timer has not expired
                    if(item.validateTimer()){

                        // Analyse the tweet
                        senti(tweet.text, function(err, result) {

                            // Let the worker calculate the results
                            item.analyse(result, function(data) {
                                // Emit the statistics to the user
                                io.sockets.in(item.user).emit('statistics', data);
                            });

                            // Add the sentiment result to the tweet object
                            tweet.sentiment = result;

                            // Store the new tweet in the active worker
                            item.pushData(tweet);

                            // Emit the new tweet to the user
                            io.sockets.in(item.user).emit('tweet', tweet);

                        });

                    } else {

                        // Emit the new status (Worker stopped)
                        io.sockets.in(item.user).emit('statusChanged', storage.getWorker(item.user).getStatus());

                        // Stop the worker if it has expired
                        item.stop();
                    }

                }
                callback();
            }, function(err) {
                if(err) console.log(err);
            });
        }
    }); // End of Twitter stream handling

    // Init socket.io connection
    io.sockets.on('connection', function(socket) {

        // On successfull concection store the user data (unique user id), join a room and create a worker
        socket.on('setUserData', function(data) {

            // Check if the user exists in the database
            User
            .findOne({
                _id: data.userId
            })
            .exec(function(err, user) {
                if (err) console.log(new Error(err));
                if (!user) console.log(new Error('Failed to load User ' + data.userId));

                // Save the user id first
                socket.set('user', data.userId, function () {
                    // Take the user id and create and join a unique room
                    socket.join(data.userId);

                    // Create a worker and store it
                    storage.createWorker(data.userId);

                    // Emit the new timer to the user
                    io.sockets.in(data.userId).emit('timerChanged', storage.getWorker(data.userId).getTimer());

                    // Emit the initial statistics to the user (empty data)
                    io.sockets.in(data.userId).emit('statistics', storage.getWorker(data.userId).getSentimentData());

                    // Emit the new status
                    io.sockets.in(data.userId).emit('statusChanged', storage.getWorker(data.userId).getStatus());
                });

            });

        });

        // Start job
        socket.on('start', function() {
            // Get the saved user id
            socket.get('user', function (err, userId) {
                // Start the worker
                storage.getWorker(userId).start();

                // Emit the new timer to the user
                io.sockets.in(userId).emit('timerChanged', storage.getWorker(userId).getTimer());

                // Emit the new status
                io.sockets.in(userId).emit('statusChanged', storage.getWorker(userId).getStatus());
            });
        });

        // Stop job
        socket.on('stop', function() {
            // Get the saved user id
            socket.get('user', function (err, userId) {
                // Stop the worker
                storage.getWorker(userId).stop();

                // Emit the new status
                io.sockets.in(userId).emit('statusChanged', storage.getWorker(userId).getStatus());
            });
        });

        // Reset job (delete active worker and create a new one)
        socket.on('reset', function() {
            // Get the saved user id
            socket.get('user', function (err, userId) {
                // Delete the worker
                storage.deleteWorker(userId);

                // Create a new worker
                storage.createWorker(userId);

                // Emit event
                io.sockets.in(userId).emit('reset');

                // Emit the new timer to the user
                io.sockets.in(userId).emit('timerChanged', storage.getWorker(userId).getTimer());

                // Emit the new status
                io.sockets.in(userId).emit('statusChanged', storage.getWorker(userId).getStatus());
            });
        });

        // Timer changed
        socket.on('timerChanged', function(data) {
            // Get the saved user id
            socket.get('user', function (err, userId) {
                // Set the timer
                storage.getWorker(userId).setTimer(data);

                // Emit the new timer to the user
                io.sockets.in(userId).emit('timerChanged', storage.getWorker(userId).getTimer());
            });
        });

    });

    // Route object
    route = {

        analyse : function(req, res) {

            var user = req.user;

            // Get the existing data of the user worker and render the page with data
            if(storage.getWorker(user.id) !== false) {
                worker = storage.getWorker(user.id);

                return res.render('job/analyse', {
                    title: 'Analyse',
                    user: user,
                    streamData: worker.getStreamData(),
                    sentimentData: worker.getSentimentData(),
                    timer: worker.getTimer(),
                    status: worker.getStatus()
                });
            }

            // Initial analyse page without any worker active
            res.render('job/analyse', {
                title: 'Analyse',
                user: user,
                streamData: null,
                sentimentData: null,
                timer: 0,
                status: "Not started"
            });

        }

    };

    return route;

};