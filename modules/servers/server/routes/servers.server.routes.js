'use strict';

/**
 * Module dependencies.
 */
var serversPolicy = require('../policies/servers.server.policy'),
  servers = require('../controllers/servers.server.controller'),
  path = require('path'), 
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Servers collection routes
  app.route('/api/servers').all([auth.loginODIN, serversPolicy.isAllowed])
    .get(servers.list)
    .post(servers.create);

  // Single server routes
  app.route('/api/servers/:serverId').all([auth.loginODIN, serversPolicy.isAllowed])
    .get(servers.read)
    .put(servers.update)
    .delete(servers.delete);

  // Finish by binding the server middleware
  app.param('serverId', servers.serverByID);
};
