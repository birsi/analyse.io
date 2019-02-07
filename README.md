# analyse.io
## Introduction
analyse.io is a simple application to analyse the sentiment of twitter status updates, defined in a specific geographical region and was impleme.

Author: Michael Birsak  
Contact: [michael@birsak.net](mailto:michael@birsak.net) / ~~[mb1668@live.mdx.ac.uk](mailto:mb1668@live.mdx.ac.uk)~~

Version: 0.1.1-beta
Date: 20/08/2013

~~Version Control: [https://bitbucket.org/birsi/analyseio](https://bitbucket.org/birsi/analyseio)~~

## Development
The current unstable development version is live available at  
~~[http://node.birsak.org](http://node.birsak.org)  
**Current live version: 0.1.1-beta (Final Beta Version)**~~

## Installation and usage
    1) Set up a MongoDB server
    2) Set up a Twitter app and get your credentials
    3) Rename config/config.public.js to config/config.js
    4) Rename config/mail.public.js to config/mail.js
    5) Modfiy the configuration files

    // Change to app dir
    cd analyse.io

    // Install dependencies
    npm install

    // Run the app (with sudo, app runs at port 80)
    sudo npm start

Change the port if needed in analyse.io/config/express.js

    app.set('port', process.env.PORT || 80);

## Todo
* Twitter login user creation problem
* Handle real time graph visualization for > 100 tweets/second
* Implement unit tests
* Code refactoring

## Recent changes (or see CHANGELOG.md)
* Implement location based search job ✓
* Implement keyword based search job ✓
* Implement seperate job creation and job view ✓
* Implement possibility of having multiple jobs (active workers) per user ✓
* Implement job save possibility and job archive ✓
* Implement graph visualization for a job ✓
