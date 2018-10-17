'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl'),
  _ = require('lodash'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features'));

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Subscriptions Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.subscription.create,
    allows: [{
      resources: '/api/subscriptions',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.subscription.list,
    allows: [{
      resources: '/api/subscriptions',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.subscription.read,
    allows: [{
      resources: '/api/subscriptions/:subscriptionId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.subscription.update,
    allows: [{
      resources: '/api/subscriptions/:subscriptionId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.subscription.delete,
    allows: [{
      resources: '/api/subscriptions/:subscriptionId',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If Subscriptions Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.subscription && req.user){
    //Root gets to access all objects
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.subscription.tenant && req.subscription.tenant.id === req.user.tenant.toString()) ||
                  (req.subscription.partner && req.subscription.partner.id === req.user.tenant.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.subscription.tenant || req.subscription.tenant.id !== req.user.tenant.toString()) {
      return res.status(403).json({
        message: 'User is not authorized'
      });
    }
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
