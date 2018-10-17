'use strict';

/**
 * Module dependencies.
 */
var subtenantsPolicy = require('../policies/subtenants.server.policy'),
  subtenants = require('../controllers/subtenants.server.controller'), 
  path = require('path'), 
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Subtenants collection routes
  app.route('/api/subtenants')
    .get([auth.loginODIN, subtenantsPolicy.isAllowed], subtenants.list)
    .post([auth.loginODIN, subtenantsPolicy.isAllowed], subtenants.create);

  // Single subtenant routes
  app.route('/api/subtenants/:subtenantId')
    .get([auth.loginODIN, subtenantsPolicy.isAllowed], subtenants.read)
    .put([auth.loginODIN, subtenantsPolicy.isAllowed], subtenants.update)
    .delete([auth.loginODIN, subtenantsPolicy.isAllowed], subtenants.delete);

  // Finish by binding the subtenant middleware
  app.param('subtenantId', subtenants.subtenantByID);
};
