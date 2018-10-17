'use strict';

/**
 * Module dependencies.
 */
var sitesPolicy = require('../policies/sites.server.policy'),
  sites = require('../controllers/sites.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Sites collection routes
  app.route('/api/sites')
    .get([auth.loginODIN, sitesPolicy.isAllowed], sites.list)
    .post([auth.loginODIN, sitesPolicy.isAllowed], sites.create);

  // Single site routes
  app.route('/api/sites/:siteId')
    .get([auth.loginODIN, sitesPolicy.isAllowed], sites.read)
    .put([auth.loginODIN, sitesPolicy.isAllowed], sites.update)
    .delete([auth.loginODIN, sitesPolicy.isAllowed], sites.delete);

  // Finish by binding the site middleware
  app.param('siteId', sites.siteByID);
};
