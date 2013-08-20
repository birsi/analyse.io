/**!
 * analyse.io
 *
 * config.public.js
 * Main configuration file public example
 * Defines development, test and production environment config
 *
 * @author Michael Birsak
 * @date 08/08/2013
 **/

/**
 *  Module dependencies
 **/
var path = require('path'),
    rootPath = path.join(__dirname, '/..');

/**
 *   Config object
 **/
module.exports = {
    development: {
        rootPath: rootPath,
        db: {
            host: "mongodb://localhost/analyseio",
            user: '***',
            pass: '***'
        },
        app: {
            name: 'analyse.io'
        },
        twitter: {
            clientID: "***",
            clientSecret: "***",
            accessToken: "***-***",
            accessTokenSecret: "***",
            callbackURL: "http://dev.birsak.net/auth/twitter/callback"
        }
    },
    test: {
        rootPath: rootPath,
        db: {
            host: 'mongodb://localhost/analyseio',
            user: '***',
            pass: '***'
        },
        app: {
            name: 'analyse.io'
        },
        twitter: {
            clientID: "***",
            clientSecret: "***",
            accessToken: "***-***",
            accessTokenSecret: "***",
            callbackURL: "http://dev.birsak.net/auth/twitter/callback"
        }
    },
    production: {
        rootPath: rootPath,
        db: {
            host: 'mongodb://node.birsak.org/analyseio',
            user: '***',
            pass: '***'
        },
        app: {
            name: 'analyse.io'
        },
        twitter: {
            clientID: "***",
            clientSecret: "***",
            accessToken: "***-***",
            accessTokenSecret: "***",
            callbackURL: "http://node.birsak.org/auth/twitter/callback"
        }
    }
};