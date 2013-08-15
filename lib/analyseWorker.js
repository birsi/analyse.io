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
var moment = require('moment');

/**
 *  AnalyseWorker class constructor
 *
 *  Defines all the instance data for a single worker
 **/
function AnalyseWorker(user) {

    // Worker data
    this.user = user;
    this.active = false; // Initial state false so the worker is inactive when created
    this.status = "Not started"; // Status can be "Not started" || "Active" || "Paused" || "Finished" || "Worker timed out"

    // Worker timer data
    this.timer = {
        workerTimeOut: 48, // Every worker gets deleted after 48 hours
        workerCreated: moment(),
        start: null,
        stop: 1, // default stop hours
        formattedStart: null,
        formattedStop: null
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

    // DateTime format settings
    this.dateFormat = "DD/MM/YYYY HH:mm:ss";

    // Set the initial stop dateTime
    var stopDateTime = moment().add('h', this.timer.stop).format(this.dateFormat);
    this.timer.formattedStop = stopDateTime;

    console.log(Date() + " Worker created: " + user);
}

/**
 *  start
 *
 *  Starts a worker
 *  Sets the instance active variable to true and handles the initial timer data
 **/
AnalyseWorker.prototype.start = function() {
    console.log(Date() + " Worker started: " + this.user);

    // Set the worker to active
    this.active = true;

    // Set the worker status
    this.status = "Active";

    // Set the start date (but only at the initial start)
    if(this.timer.start === null){

        // Set the start dateTime
        this.timer.start = moment();

        // Set the formatted start dateTime
        this.timer.formattedStart = moment().format(this.dateFormat);

        // Also set the formatted stop dateTime accordingly
        var stopDateTime = moment().add('h', this.timer.stop).format(this.dateFormat);
        this.timer.formattedStop = stopDateTime;

    }
};

/**
 *  stop
 *
 *  Stops a worker
 **/
AnalyseWorker.prototype.stop = function() {
    console.log(Date() + " Worker stopped: " + this.user);

    // Set the worker inactive
    this.active = false;

    // Set the worker status
    this.status = "Paused";
};

/**
 *  setTimer
 *
 *  Sets the timer stop
 **/
AnalyseWorker.prototype.setTimer = function(data) {
    // Parse the data string to an integer with a radix of 10
    var timer = parseInt(data, 10);

    // Ensure the timer is not smaller than 0 and not greater than 24
    if(timer <= 0 || timer > 24) {
        console.log(Date() + " Not a valid stopping time " + this.user);
        return false;
    }

    // Set the timer stop in hours
    this.timer.stop = timer;

    // Set the formatted stopping time
    if(this.timer.start !== null) {
        var start = moment(this.timer.start); // Clone the start object, otherwise the original object gets modified
        this.timer.formattedStop = start.add('h', this.timer.stop).format(this.dateFormat);
    } else {
        this.timer.formattedStop = moment().add('h', this.timer.stop).format(this.dateFormat);
    }

    console.log(Date() + " Worker " + this.user + " stop time set: " + this.timer.formattedStop);
};

/**
 *  validateTimeout
 *
 *  Checks if the worker has timed out
 **/
AnalyseWorker.prototype.validateTimeout = function() {
    // Get the current date/time
    var now = moment();

    // Get the worker creation dateTime
    var created = this.timer.workerCreated;

    // Check if the worker timeout has been reached
    if( now.isAfter(moment(created).add('h', this.timer.workerTimeOut)) ) {
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
    // Get the current date/time
    var now = moment();

    // Get the start time
    var start = this.timer.start;

    // Check if the worker stop dateTime has been reached
    if( now.isAfter(moment(start).add('h', this.timer.stop)) ) {
        console.log(Date() + ' The timer end has been reached. Going to stop...');

        // Set the worker status
        this.status = "Finished";

        return false;
    }

    // Return true if the timer is still active
    return true;
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
    // to-do: store only important data

    // Add the element at the start of the array (so that the new data appears on top)
    this.streamData.unshift(data);
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
 *  getStatus
 *
 *  Returns the status string of the worker
 **/
AnalyseWorker.prototype.getStatus = function() {
    return this.status;
};

module.exports = AnalyseWorker;