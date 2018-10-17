'use strict';

/**
 * Module dependencies.
 */
var icrsPolicy = require('../policies/icrs.server.policy'),
  icrs = require('../controllers/icrs.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Icms collection routes
  app.route('/api/icrs').all([auth.loginODIN, icrsPolicy.isAllowed])
    .get(icrs.list)
    .post(icrs.create);

  // Single icr routes
  app.route('/api/icrs/:icrId').all([auth.loginODIN, icrsPolicy.isAllowed])
    .get(icrs.read)
    .put(icrs.update)
    .delete(icrs.delete);

  // Finish by binding the icr middleware
  app.param('icrId', icrs.icrByID);
};
