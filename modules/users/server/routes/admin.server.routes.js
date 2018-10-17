'use strict';

/**
 * Module dependencies.
 */
var adminPolicy = require('../policies/admin.server.policy'),
  admin = require('../controllers/admin.server.controller'),
  auth = require('../controllers/users/users.authentication.server.controller');

module.exports = function (app) {
  // User route registration first. Ref: #713
  require('./users.server.routes.js')(app);

  // Users collection routes
  app.route('/api/users')
    .get([auth.loginODIN, adminPolicy.isAllowed], admin.list)
    .post([auth.loginODIN, adminPolicy.isAllowed], admin.create);

  // Single user routes
  app.route('/api/users/:userId')
    .get([auth.loginODIN, adminPolicy.isAllowed], admin.read)
    .put([auth.loginODIN, adminPolicy.isAllowed], admin.update)
    .delete([auth.loginODIN, adminPolicy.isAllowed], admin.delete);

  // Finish by binding the user middleware
  app.param('userId', admin.userByID);
};
