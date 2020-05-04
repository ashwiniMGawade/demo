'use strict';

/**
 * Module dependencies.
 */
var applicationsPolicy = require('../policies/applications.server.policy'),
  applications = require('../controllers/applications.server.controller'),
  auth = require('../../../users/server/controllers/users/users.authentication.server.controller');

module.exports = function (app) {
  // Tenants collection routes
  app.route('/api/applications')
    .get([auth.loginODIN, applicationsPolicy.isAllowed], applications.list)
    .post([auth.loginODIN, applicationsPolicy.isAllowed], applications.create);

  // Single application routes
  app.route('/api/applications/:applicationId')
    .get([auth.loginODIN, applicationsPolicy.isAllowed], applications.read)
    .put([auth.loginODIN, applicationsPolicy.isAllowed], applications.update)
    .delete([auth.loginODIN, applicationsPolicy.isAllowed], applications.delete);

  // Finish by binding the application middleware
  app.param('applicationId', applications.applicationByID);
};
