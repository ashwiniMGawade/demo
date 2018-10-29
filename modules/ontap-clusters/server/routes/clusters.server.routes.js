'use strict';

/**
 * Module dependencies.
 */
var clustersPolicy = require('../policies/clusters.server.policy'),
  clusters = require('../controllers/clusters.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // clusters collection routes
  app.route('/api/clusters').all([auth.loginODIN, clustersPolicy.isAllowed])
    .get(clusters.list)
    .post(clusters.create);

  // Single cluster routes
  app.route('/api/clusters/:clusterId').all([auth.loginODIN, clustersPolicy.isAllowed])
    .get(clusters.read)
    .put(clusters.update)
    .delete(clusters.delete);

  // Finish by binding the cluster middleware
  app.param('clusterId', clusters.clusterByID);
};
