'use strict';

/**
 * Module dependencies.
 */
var systemsPolicy = require('../policies/systems.server.policy'),
  systems = require('../controllers/systems.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // systems collection routes
  app.route('/api/systems').all([auth.loginODIN, systemsPolicy.isAllowed])
    .get(systems.list)
    .post(systems.create);

  // Single system routes
  app.route('/api/systems/:systemId').all([auth.loginODIN, systemsPolicy.isAllowed])
    .get(systems.read)
    .put(systems.update)
    .delete(systems.delete);

  // Finish by binding the system middleware
  app.param('systemId', systems.systemByID);
};
