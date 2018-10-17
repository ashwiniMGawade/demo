'use strict';

/**
 * Module dependencies.
 */
var notificationsPolicy = require('../policies/notifications.server.policy'),
  notifications = require('../controllers/notifications.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Icms collection routes
  app.route('/api/notifications').all([auth.loginODIN, notificationsPolicy.isAllowed])
    .get(notifications.list)
    .post(notifications.create);

  // Single notification routes
  app.route('/api/notifications/:notificationId').all([auth.loginODIN, notificationsPolicy.isAllowed])
    .get(notifications.read)
    .put(notifications.update)
    .delete(notifications.delete);

  // Finish by binding the notification middleware
  app.param('notificationId', notifications.notificationByID);
};
