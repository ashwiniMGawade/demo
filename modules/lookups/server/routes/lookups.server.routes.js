'use strict';

/**
 * Module dependencies.
 */
var lookupsPolicy = require('../policies/lookups.server.policy'),
  lookups = require('../controllers/lookups.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // All allowed Server status
  app.route('/api/lookups/status')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listStatus);

  // All allowed Storagegroup status
  app.route('/api/lookups/sgStatus')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listSGStatus);

  // All allowed Storageunit status
  app.route('/api/lookups/suStatus')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listSUStatus);

  // All allowed roles
  app.route('/api/lookups/managed')
      .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listManaged);

  //All allowed storageunit protocol
  app.route('/api/lookups/protocol')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listProtocol);

  //All allowed storageunit lunOs
  app.route('/api/lookups/lunos')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listLunOs);

  //All allowed ICM status
  app.route('/api/lookups/icrstatus')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listICMStatus);

  //All allowed Notification caNotificationtegory
  app.route('/api/lookups/notificationCategory')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listNotificationCategory);

  //All allowed providers for User
  app.route('/api/lookups/provider')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listProvider);

    //All allowed providers for User
  app.route('/api/lookups/storagePackClasses')
    .get([auth.loginODIN, lookupsPolicy.isAllowed], lookups.listStoragePackClasses);
};