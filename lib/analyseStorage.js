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
AnalyseStorage.prototype.createWorker = function(data) {
    var workers = this.storageWorkers;

    // Create a new worker
    var worker = new AnalyseWorker(data);

    // Store the worker in the storage
    workers.push(worker);

    // Return the workers ID
    return worker.id;
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
 *  getWorkersByUser
 *
 *  Returns a single worker by its id
 **/
AnalyseStorage.prototype.getWorkersByUser = function(user) {
    var workers = this.storageWorkers,
        userWorkers = [];

        // Iterate all workers and populate userWorkers
        for(var i in workers){
            if(workers[i].user === user) {
                userWorkers.push(workers[i]);
            }
        }

    if(userWorkers.length !== 0) {
        return userWorkers;
    } else {
        return false;
    }
};

/**
 *  getWorkerById
 *
 *  Returns a single worker by its id
 **/
AnalyseStorage.prototype.getWorkerById = function(id) {
    var workers = this.storageWorkers,
        index = indexOf(workers, 'id', id);

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