# analyse.io
## Introduction
analyse.io is a simple application to analyse the sentiment of twitter status updates, defined in a specific geographical region.

Author: Michael Birsak  
Contact: [michael@birsak.net](mailto:michael@birsak.net) / [mb1668@live.mdx.ac.uk](mailto:mb1668@live.mdx.ac.uk)

Version: 0.0.3  
Date: 17/08/2013

Version Control: [https://bitbucket.org/birsi/analyseio](https://bitbucket.org/birsi/analyseio)

##Development
The current unstable development version is live available at  
[http://node.birsak.org](http://node.birsak.org)  
**Current live version: 0.0.2 (Prototype)**

##Installation and usage
    // Change to app dir
    cd analyse.io

    // Install dependencies
    npm install

    // Run the app (with sudo, app runs at port 80)
    sudo npm start

Change the port if needed in analyse.io/config/express.js

    app.set('port', process.env.PORT || 80);

##Todo
* Implement location based search job
* Implement keyword based search job

## Recent changes (or see CHANGELOG.md)
* Implement seperate job creation and job view ✓
* Implement possibility of having multiple jobs (active workers) per user ✓
* Implement job save possibility and job archive ✓
* Implement graph visualization for a job ✓