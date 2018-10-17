'use strict';

/**
 * Module dependencies.
 */
var tenantsPolicy = require('../policies/tenants.server.policy'),
  tenants = require('../controllers/tenants.server.controller'),
  auth = require('../../../users/server/controllers/users/users.authentication.server.controller');

module.exports = function (app) {
  // Tenants collection routes
  app.route('/api/tenants')
    .get([auth.loginODIN, tenantsPolicy.isAllowed], tenants.list)
    .post([auth.loginODIN, tenantsPolicy.isAllowed], tenants.create);

  // Single tenant routes
  app.route('/api/tenants/:tenantId')
    .get([auth.loginODIN, tenantsPolicy.isAllowed], tenants.read)
    .put([auth.loginODIN, tenantsPolicy.isAllowed], tenants.update)
    .delete([auth.loginODIN, tenantsPolicy.isAllowed], tenants.delete);

  // Finish by binding the tenant middleware
  app.param('tenantId', tenants.tenantByID);
};
