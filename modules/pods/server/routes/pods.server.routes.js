'use strict';

/**
 * Module dependencies.
 */
var podsPolicy = require('../policies/pods.server.policy'),
  pods = require('../controllers/pods.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Pods collection routes
  app.route('/api/pods').all([auth.loginODIN, podsPolicy.isAllowed])
    .get(pods.list)
    .post(pods.create);

  // Single pod routes
  app.route('/api/pods/:podId').all([auth.loginODIN, podsPolicy.isAllowed])
    .get(pods.read)
    .put(pods.update)
    .delete(pods.delete);

  // Finish by binding the pod middleware
  app.param('podId', pods.podByID);
};
