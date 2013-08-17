/**!
 * analyse.io
 *
 * user.js
 * Job model
 * Using mongoose object data modelling for creating the job model
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var mongoose = require('mongoose');

/**
 *  Job Schema definition
 *  http://mongoosejs.com/docs/guide.html
 **/
var JobSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        default: 'Active'
    },
    filterData: {
        type: Object
    },
    timer: {
        type: Object
    },
    streamData: {
        type: Object
    },
    sentimentData: {
        type: Object
    }

});

/**
 *  User Methods
 *  Available prototype methods which get inherited to the user model
 *  http://mongoosejs.com/docs/guide.html#methods
 **/
JobSchema.methods = {

};

// Construct the job model according to the defined schema
mongoose.model('Job', JobSchema);