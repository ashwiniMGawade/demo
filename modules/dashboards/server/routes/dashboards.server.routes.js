'use strict';

/**
 * Module dependencies.
 */
var dashboardsPolicy = require('../policies/dashboards.server.policy'),
  dashboards = require('../controllers/dashboards.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Dashboards collection routes
  app.route('/api/storagegraphs').all([auth.loginODIN, dashboardsPolicy.isAllowed])
    .get(dashboards.getGraphs);

  app.route('/api/storagegraphs/test').all([auth.loginODIN, dashboardsPolicy.isAllowed])
  .get(dashboards.getTestGraph);

  app.route('/api/health/:type').all([auth.loginODIN, dashboardsPolicy.isAllowed])
  .get(dashboards.getHealthData);

};
