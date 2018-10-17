'use strict';

/**
 *  Storage unit Module dependencies.
 */
var storageunitsPolicy = require('../policies/storageunits.server.policy'),
  storageunits = require('../controllers/storageunits.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // storageunits collection routes
  app.route('/api/storageunits').all([auth.loginODIN, storageunitsPolicy.isAllowed])
    .get(storageunits.list)
    .post(storageunits.create);

  // Single server routes
  app.route('/api/storageunits/:storageunitId').all([auth.loginODIN, storageunitsPolicy.isAllowed])
    .get(storageunits.read)
    .put(storageunits.update)
    .delete(storageunits.delete);

  // Finish by binding the server middleware
  app.param('storageunitId', storageunits.storageunitByID);
};
