/**!
 * analyse.io
 *
 * analyseWorker.js
 * AnalyseWorker class
 * Defines the main worker class for the application
 * Stores and handles all important data used to analyse a given stream
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var moment = require('moment'),
    utility = require('../lib/utility'),
    inside = require('point-in-polygon');

/**
 *  AnalyseWorker class constructor
 *
 *  Defines all the instance data for a single worker
 **/
function AnalyseWorker(data) {

    // Worker data
    this.id = data.id;                  // Worker ID
    this.user = data.user;              // User ID
    this.active = true;                 // Initial state true so the worker is active when created
    this.status = "Active";             // "Active" || "Paused" || "Finished" || "Worker timed out"

    // DateTime format settings
    this.dateFormat = "DD/MM/YYYY HH:mm:ss";

    // Filter data
    this.filterData = {
        coordinates: data.coordinates,
        location: data.location,
        keywords: data.keywords
    };

    // Worker timer data
    this.timer = {
        workerTimeOut: 24.0001,     // Every worker gets deleted after 24 hours
        start: moment(),            // Set the worker creation time
        stop: data.timer,
        formattedStart: moment().format(this.dateFormat),
        formattedStop: moment().add('h', data.timer).format(this.dateFormat)
    };

    // Tweets
    this.streamData = [];

    // Sentiment
    this.sentimentData = {
        tweetCount: 0,
        positiveTweets: 0,
        negativeTweets: 0,
        neutralTweets: 0,
        sentimentScorePerTweet: 0,
        sentimentScore: 0,
        sentimentScorePositive: 0,
        sentimentScoreNegative: 0,
        sentimentComparative: 0
    };

    console.log(Date() + " Worker created: " + this.id);

}

/**
 *  start
 *
 *  Starts a worker
 *  Sets the instance active variable to true and handles the initial timer data
 **/
AnalyseWorker.prototype.start = function() {
    console.log(Date() + " Worker started: " + this.id);

    // Set the worker to active
    this.active = true;

    // Set the worker status
    this.status = "Active";

};

/**
 *  pause
 *
 *  Pauses a worker
 **/
AnalyseWorker.prototype.pause = function() {
    console.log(Date() + " Worker paused: " + this.id);

    // Set the worker inactive
    this.active = false;

    // Set the worker status
    this.status = "Paused";
};



/**
 *  validateTimeout
 *
 *  Checks if the worker has timed out
 **/
AnalyseWorker.prototype.validateTimeout = function() {
    // Get the current time
    var now = moment();

    // Get the start time
    var start = this.timer.start;

    // Check if the worker timeout has been reached
    if( now.isAfter(moment(start).add('h', this.timer.workerTimeOut)) ) {
        console.log(Date() + ' The timer has expired (timed out)!');

        // Set the worker status
        this.status = "Worker timed out";

        // Return true if the worker timed out
        return true;
    }
    return false;
};

/**
 *  validateTimer
 *
 *  Checks if the timer is up
 **/
AnalyseWorker.prototype.validateTimer = function() {
    // Get the current time
    var now = moment();

    // Get the start time
    var start = this.timer.start;

    // Check if the worker stop time has been reached
    if( now.isAfter(moment(start).add('h', this.timer.stop)) ) {
        console.log(Date() + ' The timer end has been reached. Going to stop...');

        // Set the worker status
        this.status = "Finished";

        // Set the worker inactive
        this.active = false;

        return false;
    }

    // Return true if the timer is still active
    return true;
};

/**
 *  checkKeywords
 *
 *  Check if the tweet contains any of the given keywords
 *  Return false if the tweet doesn't contain any keyword
 **/
AnalyseWorker.prototype.checkKeywords = function(text) {

    var keywords = this.filterData.keywords,
        containsKeyword = false;

    // Only check keywords if the array contains any keywords
    if(keywords.length !== 0) {
        for(var i in keywords) {
            if(text.indexOf(keywords[0]) !== -1) {
                containsKeyword = true;
            }
        }
        if(!containsKeyword) return false;
    }

    return true;

};

/**
 *  checkLocation
 *
 *  Check if the tweet's geographic coordinates (point) or place coordinates (polygon) (https://dev.twitter.com/docs/platform-objects/tweets)
 *  are inside of the given search location
 **/
AnalyseWorker.prototype.checkLocation = function(tweet) {

    var searchCoordinates = this.filterData.coordinates,
        tweetCoordinates = tweet.coordinates,
        tweetPlace = tweet.place;

        if(tweetCoordinates !== null) {
            tweetCoordinates = tweetCoordinates.coordinates;
            tweetCoordinates = {
                lng: tweetCoordinates[0],
                lat: tweetCoordinates[1]
            };

            // Check if tweets geographic coordinates are inside of search location
            if(utility.pointInBoundaries(searchCoordinates, tweetCoordinates)) {
                return true;
            }

        }

        if(tweetPlace !== null && tweetPlace.bounding_box !== null) {

            tweetPlace = tweetPlace.bounding_box.coordinates[0]; // Polygon, can contain multiple points
            // Check if the defined search center location coordinates are inside of the place polygon
            if( inside(searchCoordinates.centerCoordinates, tweetPlace) ) {
                return true;
            }
        }

        return false;

};

/**
 *  analyse
 *
 *  Function which handles a single result of a single streaming data result
 *  Returns the analysed data asynchronously in the callback function
 **/
AnalyseWorker.prototype.analyse = function(result, callback) {
    // Increment tweet count
    this.sentimentData.tweetCount++;

    // Set positive, negative and neutral and scores
    if (result.score > 0) {
        this.sentimentData.positiveTweets++;
        this.sentimentData.sentimentScorePositive += result.score;
    } else if (result.score < 0) {
        this.sentimentData.negativeTweets++;
        this.sentimentData.sentimentScoreNegative -= result.score;
    } else {
        this.sentimentData.neutralTweets++;
    }

    // Set sentiment score (difference between pos and neg score)
    this.sentimentData.sentimentScore += result.score;

    // Set sentiment comparative (sentiment score of tweet / words of tweet)
    this.sentimentData.sentimentComparative += result.comparative;

    // Average sentiment per tweet (sentimentScore / tweetCount)
    this.sentimentData.sentimentScorePerTweet = this.sentimentData.sentimentScore / this.sentimentData.tweetCount;

    // Return the calculated sentiment data
    return callback(this.sentimentData);
};

/**
 *  pushData
 *
 *  Saves a single data row from a stream to the streamData array of the instance
 **/
AnalyseWorker.prototype.pushData = function(data) {
    // Create a new object with only important Tweet data
    var newData = {
        created_at: data.created_at,
        id: data.id,
        text: data.text,
        user: {
            name: data.user.name
        },
        coordinates: data.coordinates,
        place: data.place,
        sentiment: data.sentiment
    };

    // Add the element at the start of the array (so that the new data appears on top)
    this.streamData.unshift(newData);
};

/**
 *  getStreamData
 *
 *  Returns the streamData array containing data objects
 **/
AnalyseWorker.prototype.getStreamData = function() {
    // Return the stream data
    return this.streamData;
};

/**
 *  getSentimentData
 *
 *  Returns the sentimentData object
 **/
AnalyseWorker.prototype.getSentimentData = function() {
    // Return the sentiment data
    return this.sentimentData;
};

/**
 *  getTimer
 *
 *  Returns the workers timer object
 **/
AnalyseWorker.prototype.getTimer = function() {
    // Return the sentiment data
    return this.timer;
};

/**
 *  getFilterData
 *
 *  Returns the workers timer object
 **/
AnalyseWorker.prototype.getFilterData = function() {
    // Return the filter data
    return this.filterData;
};

/**
 *  getStatus
 *
 *  Returns the status string of the worker
 **/
AnalyseWorker.prototype.getStatus = function() {
    return this.status;
};

module.exports = AnalyseWorker;