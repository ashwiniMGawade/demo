'use strict';

/**
 * Module dependencies.
 */
var supportPolicy = require('../policies/support.server.policy'),
  supports = require('../controllers/support.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // All allowed Server status
  app.route('/api/support/downloads')
    //.post([auth.loginODIN, supportPolicy.isAllowed], supports.downloadJobStatus); 
    .get([auth.loginODIN, supportPolicy.isAllowed], supports.downloadJobStatus);  

  app.route('/api/support/policy')
    .post([auth.loginODIN, supportPolicy.isAllowed], supports.acceptPolicy);  

  app.route('/api/support/softwarekey')
    //.post([auth.loginODIN, supportPolicy.isAllowed], supports.downloadJobStatus); 
    .get([auth.loginODIN, supportPolicy.isAllowed], supports.getSoftwareKey);  
};
