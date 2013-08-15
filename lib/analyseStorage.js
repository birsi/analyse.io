/**!
 * analyse.io
 *
 * analyseStorage.js
 * AnalyseStorage class
 * Defines the server-side js storage for all workers (analyseWorker)
 * Stores and handles all workers in an array
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var AnalyseWorker = require('./analyseWorker'),
moment = require('moment');


/**
 *  AnalyseStorage class constructor
 *
 *  Initializes the sotrageWorkers array
 **/
function AnalyseStorage() {

    // Store all workers in an array
    this.storageWorkers = [];

}

/**
 *  createWorker
 *
 *  Creates a new worker
 *  A user can only have one worker at a time
 *  Creates the worker and stores it in the array
 **/
AnalyseStorage.prototype.createWorker = function(user) {
    var workers = this.storageWorkers;
    // Ensure that a user has only one worker running
    if(indexOf(workers, 'user', user) !== -1) {
        console.log("A worker already exists for user: " + user);
        return false;
    }
    workers.push(new AnalyseWorker(user));
    return true;
};

/**
 *  deleteWorker
 *
 *  Deletes a worker from the storage
 **/
AnalyseStorage.prototype.deleteWorker = function(user) {
    var workers = this.storageWorkers,
        index = indexOf(workers, 'user', user);

    // Remove the worker from the storage array
    workers.splice(index, 1);

    console.log(new Date() + " Worker deleted: " + user);

};

/**
 *  getWorkers
 *
 *  Returns all stored workers
 **/
AnalyseStorage.prototype.getWorkers = function() {
    return this.storageWorkers;
};

/**
 *  getWorker
 *
 *  Returns a single worker belonging to a user, or false
 **/
AnalyseStorage.prototype.getWorker = function(user) {
    var workers = this.storageWorkers,
        index = indexOf(workers, 'user', user);

    if(index !== -1) {
        return workers[index];
    } else {
        return false;
    }
};

/**
 *  indexOf
 *
 *  Array helper method to find the index of an array containing objects
 **/
function indexOf(element, prop, val) {
    for (var i = 0, len = element.length; i < len; i++) {
        if (element[i][prop] === val) return i;
    }
    return -1;
}

module.exports = AnalyseStorage;