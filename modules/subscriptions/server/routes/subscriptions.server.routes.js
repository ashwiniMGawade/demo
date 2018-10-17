'use strict';

/**
 * Module dependencies.
 */
var subscriptionsPolicy = require('../policies/subscriptions.server.policy'),
  subscriptions = require('../controllers/subscriptions.server.controller'),
  auth = require('../../../users/server/controllers/users/users.authentication.server.controller');

module.exports = function (app) {
  // Subscriptions collection routes
  app.route('/api/subscriptions')
    .get([auth.loginODIN, subscriptionsPolicy.isAllowed], subscriptions.list)
    .post([auth.loginODIN, subscriptionsPolicy.isAllowed], subscriptions.create);

  // Single subscription routes
  app.route('/api/subscriptions/:subscriptionId')
    .get([auth.loginODIN, subscriptionsPolicy.isAllowed], subscriptions.read)
    .put([auth.loginODIN, subscriptionsPolicy.isAllowed], subscriptions.update)
    .delete([auth.loginODIN, subscriptionsPolicy.isAllowed], subscriptions.delete);

  // Finish by binding the subscription middleware
  app.param('subscriptionId', subscriptions.subscriptionByID);
};
