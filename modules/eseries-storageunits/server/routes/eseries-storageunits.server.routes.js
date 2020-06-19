'use strict';

/**
 *  Storage unit Module dependencies.
 */
var storageunitsPolicy = require('../policies/eseries-storageunits.server.policy'),
  storageunits = require('../controllers/eseries-storageunits.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // storageunits collection routes
  app.route('/api/eseries-storageunits').all([auth.loginODIN, storageunitsPolicy.isAllowed])
    .get(storageunits.list)
    .post(storageunits.create);
  
  app.route('/api/eseries-storageunits/getListOfIgroups').all([auth.loginODIN, storageunitsPolicy.isAllowed])
    .get(storageunits.getListOfIgroups)

  // Single server routes
  app.route('/api/eseries-storageunits/:eseriesStorageunitId').all([auth.loginODIN, storageunitsPolicy.isAllowed])
    .get(storageunits.read)
    .put(storageunits.update)
    .delete(storageunits.delete);

  app.route('/api/peers').all([auth.loginODIN, storageunitsPolicy.isAllowed])
  .get(storageunits.getPeers) 
  

  // Finish by binding the server middleware
  app.param('eseriesStorageunitId', storageunits.storageunitByID);
};
