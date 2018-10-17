'use strict';

/**
 * Module dependencies.
 */
var storagegroupsPolicy = require('../policies/storagegroups.server.policy'),
  storagegroups = require('../controllers/storagegroups.server.controller'),
  snapshots = require('../controllers/snapshots/storagegroups.snapshots.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Storagegroups collection routes
  app.route('/api/storagegroups').all([auth.loginODIN, storagegroupsPolicy.isAllowed])
    .get(storagegroups.list)
    .post(storagegroups.create);

  // Single storagegroup routes
  app.route('/api/storagegroups/:storagegroupId').all([auth.loginODIN, storagegroupsPolicy.isAllowed])
    .get(storagegroups.read)
    .put(storagegroups.update)
    .delete(storagegroups.delete);

  //snapshots routes
  app.route('/api/storagegroups/:storagegroupId/snapshots').all([auth.loginODIN, storagegroupsPolicy.isAllowed])
    .get(snapshots.list)
    .post(snapshots.create);

  //single snapshots routes
  app.route('/api/storagegroups/:storagegroupId/snapshots/:snapshotCode').all([auth.loginODIN, storagegroupsPolicy.isAllowed])
    .delete(snapshots.delete);

  // Finish by binding the storagegroup middleware
  app.param('storagegroupId', storagegroups.storagegroupByID);

  // Finish by binding the snapshot middleware
  //app.param('snaphshotId', snapshots.snapshotByID);
};
