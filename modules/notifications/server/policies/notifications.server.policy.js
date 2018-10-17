'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  acl = require('acl'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features'));

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke notifications Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.notification.create,
    allows: [{
      resources: '/api/notifications',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.notification.list,
    allows: [{
      resources: '/api/notifications',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.notification.read,
    allows: [{
      resources: '/api/notifications/:notificationId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.notification.update,
    allows: [{
      resources: '/api/notifications/:notificationId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.notification.delete,
    allows: [{
      resources: '/api/notifications/:notificationId',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If notifications Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.notification && req.user) {
    // Ensures for user.tenant.id matches tenant.id in URL for all requests (not applicable to admin)
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {  
    } else if (req.user.tenant &&  req.notification.tenants.length > 0 && !_.includes(_.invokeMap(req.notification.tenants, 'toString'), req.user.tenant.toString())) {
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
          message: 'User is not authorized due to roles'
        });
      }
    }
  });
};
