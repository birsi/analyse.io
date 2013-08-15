/**!
 * analyse.io
 *
 * utility.js
 * Definition of utlity and helper methods
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

module.exports = {

    /**
     *  errorHelper
     *
     *  Takes an error, if the error is an object (mongoose error, or other errorobject,
     *  iterates over it and returns an array containing the error message(s)
     **/
    errorHelper: function(err) {

        // If the error is not an object, just return the error within an array
        if (typeof err !== 'object') return [err];

        var errors = [];
        var keys = [];

        // Check if it is a mongoose validation error (err.errors)
        if(typeof err.errors !== 'undefined') {
            keys = Object.keys(err.errors);
            keys.forEach(function(key) {
                errors.push(err.errors[key].type);
            });
        // If it is a general error invoked by new Error() just push the error to the array
        } else {
            errors.push(err);
        }

        return errors;
    }

};