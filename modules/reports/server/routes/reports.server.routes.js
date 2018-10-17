'use strict';

/**
 * Module dependencies.
 */

var reports = require('../controllers/reports.server.controller'),
  reportsPolicy = require('../policies/reports.server.policy'),
  auth = require('../../../users/server/controllers/users/users.authentication.server.controller');

module.exports = function (app) {
  // Report collection routes
  app.route('/api/reports')
    .get([auth.loginODIN, reportsPolicy.isAllowed], reports.list);

  // Single report route
  app.route('/api/reports/:filename')
    .get([auth.loginODIN, reportsPolicy.isAllowed], reports.read);

};
