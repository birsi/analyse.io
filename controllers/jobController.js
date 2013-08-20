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
    moment = require('moment'),
    Job = mongoose.model('Job'),
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
        locations: [-180,-90,180,90] // The whole world -180,-90,180,90
    });

    // Twitter stream handling
    stream.on('tweet', function(tweet) {

        // Check if there are workers in the storage
        if (storage.getWorkers().length > 0) {
            var workers = storage.getWorkers();

            // Iterate all workers of the storage asynchronously to handle the worker of each user
            async.each(workers, function(item, callback) {

                // Check if the worker has timed out (Every worker has a 48hour lifetime)
                if (item.validateTimeout() === true) {

                    // Emit the new status (Worker timed out)
                    io.sockets. in (item.id).emit('statusChanged', storage.getWorkerById(item.id).getStatus());

                    // Delete the worker
                    storage.deleteWorker(item.id);

                    // Delete the job
                    Job
                        .findOne({
                            _id: item.id
                        })
                        .exec(function(err, job) {
                            if (err) console.log(err);
                            if (!job) console.log(new Error('Failed to find Job ' + item.id));

                            // Remove the job
                            job.remove(function(err) {
                                if (err) console.log(err);
                                console.log(new Date() + " Job " + item.id + " was delete because of timeout!");
                            });
                        });

                    return false;
                }

                // Check if the worker is active
                if (item.active === true) {

                    // Check if the worker timer has not expired
                    if (item.validateTimer()) {

                        // Check for the right location
                        if(item.checkLocation(tweet) === false) {
                            return false;
                        }

                        // Check if the tweet contains any keyword
                        if(item.checkKeywords(tweet.text) === false) {
                            return false;
                        }

                        // Analyse the tweet
                        senti(tweet.text, function(err, result) {

                            // Let the worker calculate the results
                            item.analyse(result, function(data) {
                                // Emit the statistics to the user
                                io.sockets. in (item.id).emit('statistics', data);
                            });

                            // Add the sentiment result to the tweet object
                            tweet.sentiment = result;

                            // Store the new tweet in the active worker
                            item.pushData(tweet);

                            // Emit the new tweet to the user
                            io.sockets. in (item.id).emit('tweet', tweet);

                        });

                    // Worker has finished
                    } else {

                        // Emit the new status (Worker finished)
                        io.sockets. in (item.workerId).emit('statusChanged', item.getStatus());

                        // Delete the worker
                        storage.deleteWorker(item.id);

                        // Find and save the job
                        Job
                            .findOne({
                                _id: item.id
                            })
                            .exec(function(err, job) {
                                if (err) console.log(err);
                                if (!job) console.log(new Error('Failed to find Job ' + item.id));

                                // Update the job
                                job.status = item.getStatus();
                                job.filterData = item.getFilterData();
                                job.streamData = item.getStreamData();
                                job.sentimentData = item.getSentimentData();
                                job.timer = item.getTimer();

                                job.save(function(err) {
                                    if (err) console.log(err);
                                    console.log(new Date() + " Job " + item.id + " was saved");
                                });

                            });

                    }

                }
                callback();
            }, function(err) {
                if (err) console.log(err);
            });
        }
    }); // End of Twitter stream handling

    /**
     *  Socket.io connection and event handling
     **/
    io.sockets.on('connection', function(socket) {

        // On successfull concection store the worker data (unique worker id) and join a room
        socket.on('setWorkerData', function(data) {

            // Only set the worker data if the worker really exists (User could emit a wrong id manually)
            if (storage.getWorkerById(data.workerId)) {
                // Set the worker id
                socket.set('worker', data.workerId, function() {
                    // Take the worker id and create and join a unique room
                    socket.join(data.workerId);
                });
            } else {
                // Log the potential "hacking attempt"
                console.log("Hacking attempt detected");
            }

        });

        // Start job
        socket.on('start', function() {
            // Get the saved worker id
            socket.get('worker', function(err, workerId) {
                var worker = storage.getWorkerById(workerId);

                // If the worker doesn't exist, just return false and log the event
                if (!worker) {
                    console.log("Worker doesn't exist");
                    return false;
                }

                // Start the worker
                worker.start();

                // Emit the new status
                io.sockets. in (workerId).emit('statusChanged', worker.getStatus());
            });
        });

        // Pause job
        socket.on('pause', function() {
            // Get the saved worker id
            socket.get('worker', function(err, workerId) {
                var worker = storage.getWorkerById(workerId);

                // If the worker doesn't exist, just return false and log the event
                if (!worker) {
                    console.log("Worker doesn't exist");
                    return false;
                }

                // Stop the worker
                worker.pause();

                // Emit the new status
                io.sockets. in (workerId).emit('statusChanged', worker.getStatus());
            });
        });

    });

    // Route object
    route = {

        analyse: function(req, res) {

            var user = req.user;

            // Get the existing data of the user worker and render the page with data
            if (storage.getWorker(user.id) !== false) {
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

        },

        /**
         *  Create a new worker
         **/
        create: function(req, res) {

            // POST request
            if (req.method === 'POST') {

                var user = req.user,
                    error = false;

                var coordinates = req.body.coordinates,
                    centerCoordinates = req.body.centerCoordinates,
                    location = req.body.locationTitle,
                    keywords = req.body.keywords.replace(/\s+$/,''), // Trim trailing spaces (rtrim)
                    timer = req.body.timer;

                var worker = null;

                // Validations
                if (timer <= 0 || timer > 24) {
                    error = true;
                    req.flash('error', 'The timer is not valid!');
                }
                if(keywords !== '') {
                    // If keywords are provided, put them in an array
                    keywords = keywords.split(' ');
                }
                if(coordinates === '') {
                    error = true;
                    req.flash('error', 'You need to enter a valid location! (Country, city, or region)');
                }
                if(coordinates !== '') {
                    coordinates = coordinates.split(',');
                    coordinates = {
                        SWLng: coordinates[0],
                        SWLat: coordinates[1],
                        NELng: coordinates[2],
                        NELat: coordinates[3]
                    };
                }
                if(centerCoordinates !== '') {
                    centerCoordinates = centerCoordinates.split(',');
                    coordinates.centerCoordinates = [centerCoordinates[0], centerCoordinates[1]];
                }

                // If no error occurs, create the job (without any data, except the user id)
                if (!error) {

                    var job = new Job({
                        user: user.id
                    });

                    // Create the job in the db
                    job.save(function(err, job) {
                        if (err) {
                            console.log(err);
                            // Return the page and display errors
                            return res.render('job/create', {
                                title: 'Create a job',
                                message: req.flash('error')
                            });
                        }

                        console.log(new Date() + " Job created: " + job.id);

                        // If everything successful, define the data and create the worker
                        var data = {
                            id: job.id,
                            user: user.id,
                            coordinates: coordinates,
                            location: location,
                            keywords: keywords,
                            timer: timer
                        };

                        // Create the worker
                        worker = storage.createWorker(data);

                        // Redirect to the list view
                        res.redirect('/job/list');
                    });


                } else {
                    // Return the page and display errors
                    return res.render('job/create', {
                        title: 'Create a job',
                        message: req.flash('error')
                    });
                }

            // GET request
            } else {
                // Render the create page
                res.render('job/create', {
                    title: 'Create a job',
                    message: req.flash('error')
                });
            }

        },

        /**
         *  Stop the worker and save the job to the db
         **/
        save : function(req, res, next) {
            var workerId = req.params.workerId,
                worker = storage.getWorkerById(workerId),
                user = req.user;

            if (!worker) {
                req.flash('error', 'This job does not exist!');
                return res.redirect('/job/list');
                //return next("There is no fucking worker!");
            }

            if (worker.user !== user.id) {
                req.flash('error', 'This job does not belong to you!');
                return res.redirect('/job/list');
                //return next("This job doesn't belong to you!");
            }

            // Emit the new status (If the job is open in multiple views)
            worker.status = "Stopped & Saved";
            io.sockets. in (worker.id).emit('statusChanged', worker.getStatus());

            // Update the formatted stopping time
            worker.timer.formattedStop = moment().format("DD/MM/YYYY HH:mm:ss");

            // Delete the worker
            storage.deleteWorker(worker.id);

            // Find and save the job
            Job
                .findOne({
                    _id: worker.id
                })
                .exec(function(err, job) {
                    if (err) console.log(err);
                    if (!job) console.log(new Error('Failed to find Job ' + worker.id));

                    // Update the job
                    job.status = worker.getStatus();
                    job.filterData = worker.getFilterData();
                    job.streamData = worker.getStreamData();
                    job.sentimentData = worker.getSentimentData();
                    job.timer = worker.getTimer();

                    job.save(function(err) {
                        if (err) console.log(err);
                        console.log(new Date() + " Job " + worker.id + " was saved");
                    });

                    // Redirect to the archive
                    res.redirect('/job/archive');
                });


        },

        delete: function(req, res, next) {

            var workerId = req.params.workerId,
                worker = storage.getWorkerById(workerId),
                user = req.user;

            if (!worker) {
                req.flash('error', 'This job does not exist!');
                return res.redirect('/job/list');
                //return next("There is no fucking worker!");
            }

            if (worker.user !== user.id) {
                req.flash('error', 'This job does not belong to you!');
                return res.redirect('/job/list');
                //return next("This job doesn't belong to you!");
            }

            // Emit the new status (If the job is open in multiple views)
            worker.status = "Deleted";
            io.sockets. in (worker.id).emit('statusChanged', worker.getStatus());

            // Delete the worker
            storage.deleteWorker(worker.id);

            // Delete the job
            Job
                .findOne({
                    _id: worker.id
                })
                .exec(function(err, job) {
                    if (err) console.log(err);
                    if (!job) console.log(new Error('Failed to find Job ' + worker.id));

                    // Remove the job
                    job.remove(function(err) {
                        if (err) console.log(err);
                        console.log(new Date() + " Job " + worker.id + " was deleted");
                    });

                    // Redirect back to the list view
                    res.redirect('/job/list');
                });

        },

        view: function(req, res, next) {

            var workerId = req.params.workerId,
                worker = storage.getWorkerById(workerId),
                user = req.user;

            if (!worker) {
                req.flash('error', 'This job does not exist!');
                return res.redirect('/job/list');
                //return next("There is no fucking worker!");
            }

            if (worker.user !== user.id) {
                req.flash('error', 'This job does not belong to you!');
                return res.redirect('/job/list');
                //return next("This job doesn't belong to you!");
            }

            // Render the view page
            res.render('job/view', {
                title: 'Job',
                user: user,
                workerId: workerId,
                filterData: worker.getFilterData(),
                streamData: worker.getStreamData(),
                sentimentData: worker.getSentimentData(),
                timer: worker.getTimer(),
                status: worker.getStatus()
            });
        },

        archive: function(req, res, next) {

            var user = req.user;

            // Find all jobs in the archive belonging to the user
            Job
                .find({
                    user: user.id,
                })
                .where('status').in(['Stopped & Saved', 'Finished'])
                .exec(function(err, jobs){
                    if (err) return next(err);

                    // Render the archive view
                    res.render('job/archive', {
                        title: 'Job Archive',
                        workers: jobs,
                        message: req.flash('error')
                    });
                });
        },

        archiveView: function(req, res, next) {

            var jobId = req.params.jobId,
                user = req.user;

            Job
                .findOne({
                    _id: jobId
                })
                .exec(function(err, job) {
                    if (err) return next(err);

                    if (!job) {
                        req.flash('error', 'This job does not exist!');
                        return res.redirect('/job/archive');
                        //return next("There is no fucking worker!");
                    }

                    // Check if the job belongs to the user
                    if(job.user != user.id) {
                        req.flash('error', 'This job does not belong to you!');
                        return res.redirect('/job/archive');
                        //return next("This job doesn't belong to you!");
                    }

                    // Render the view page
                    res.render('job/archiveView', {
                        title: 'Job - Archive',
                        user: user,
                        workerId: jobId,
                        filterData: job.filterData,
                        streamData: job.streamData,
                        sentimentData: job.sentimentData,
                        timer: job.timer,
                        status: job.status
                    });
                });

        },

        archiveDelete: function(req, res, next) {

            var jobId = req.params.jobId,
                user = req.user;

            // Delete the job
            Job
                .findOne({
                    _id: jobId
                })
                .exec(function(err, job) {
                    if (err) return next(err);

                    if (!job) {
                        req.flash('error', 'This job does not exist!');
                        return res.redirect('/job/archive');
                        //return next("There is no fucking worker!");
                    }

                    // Check if the job belongs to the user
                    if(job.user != user.id) {
                        req.flash('error', 'This job does not belong to you!');
                        return res.redirect('/job/archive');
                        //return next("This job doesn't belong to you!");
                    }

                    // Check if the job belongs to the user
                    if(job.user != user.id) next(new Error('This job does not belong to you!'));

                    // Remove the job
                    job.remove(function(err) {
                        if (err) console.log(err);
                        console.log(new Date() + " Job " + job.id + " was deleted");
                    });

                    // Redirect back to the archive
                    res.redirect('/job/archive');
                });

        },

        list: function(req, res, next) {

            var user = req.user,
                workers = storage.getWorkersByUser(user.id),
                userWorkers = [];

            if (!workers) {
                // Return to the list with empty workers
                return res.render('job/list', {
                            title: 'Job List',
                            workers: null,
                            message: req.flash('error')
                        });
            }

            for(var i in workers) {
                userWorkers.push({
                    id: workers[i].id,
                    status: workers[i].getStatus(),
                    timer: workers[i].getTimer(),
                    filterData: workers[i].getFilterData(),
                    sentimentData: workers[i].getSentimentData()
                });
            }

            // Render the list page
            res.render('job/list', {
                title: 'Job List',
                workers: userWorkers,
                message: req.flash('error')
            });
        },

        getJSON: function(req, res) {
            var workerId = req.params.workerId,
                worker = storage.getWorkerById(workerId),
                user = req.user;

            if (!worker) {
                return next("There is no fucking worker!");
            }

            var jsonString = JSON.stringify(worker);

            res.json(JSON.parse(jsonString));

        }
    };

    return route;

};