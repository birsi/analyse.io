/**!
 * analyse.io
 *
 * config.js
 * Main configuration file
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
            user: 'analyse',
            pass: 'birsak'
        },
        app: {
            name: 'analyse.io'
        },
        twitter: {
            clientID: "UccXdFbTOkYTmy9fEk1QA",
            clientSecret: "v8RklEt0ifXHZTVIKM9u20H0GjDNGoD1f78hPCit7w",
            accessToken: "380902138-CiZgCfRz495qtwDtXGAutSOm6sl1szB024vdNa9a",
            accessTokenSecret: "KdrbmHBVriCWMEm4OBOKMvOlPk3K4DsL2Oo4YMcOpk",
            callbackURL: "http://dev.birsak.net/auth/twitter/callback"
        }
    },
    test: {
        rootPath: rootPath,
        db: {
            host: 'mongodb://localhost/analyseio',
            user: 'analyse',
            pass: 'birsak'
        },
        app: {
            name: 'analyse.io'
        },
        twitter: {
            clientID: "UccXdFbTOkYTmy9fEk1QA",
            clientSecret: "v8RklEt0ifXHZTVIKM9u20H0GjDNGoD1f78hPCit7w",
            accessToken: "380902138-CiZgCfRz495qtwDtXGAutSOm6sl1szB024vdNa9a",
            accessTokenSecret: "KdrbmHBVriCWMEm4OBOKMvOlPk3K4DsL2Oo4YMcOpk",
            callbackURL: "http://dev.birsak.net/auth/twitter/callback"
        }
    },
    production: {
        rootPath: rootPath,
        db: {
            host: 'mongodb://node.birsak.org/analyseio',
            user: 'birsi',
            pass: '1birsak'
        },
        app: {
            name: 'analyse.io'
        },
        twitter: {
            clientID: "UruhADdH5PMNO4Tg1ZifA",
            clientSecret: "jhgkxhXW4lEXJeuadqx7XIU4zHLfKrSiLEgilzdU",
            accessToken: "380902138-5apqF1x6HChZh2J0pjqJNWtFlgPUPzXIWEXgI0Lz",
            accessTokenSecret: "Bw755oJ6Yv6Q15QSWBPiSOCuNIMcXaGgM8c1ozk",
            callbackURL: "http://node.birsak.org/auth/twitter/callback"
        }
    }
};