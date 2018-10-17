'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Reports Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['root', 'partner', 'l1ops'],
    allows: [{
      resources: '/api/reports',
      permissions: '*'
    }, {
      resources: '/api/reports/:filename',
      permissions: '*'
    }]
  },{
    roles: ['admin', 'user','read'],
    allows: [{
      resources: '/api/reports',
      permissions: ['get']
    }, {
      resources: '/api/reports/:filename',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Reports Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
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
