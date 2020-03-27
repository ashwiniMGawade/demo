'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  acl = require('acl');


// Using the memory backend
acl = new acl(new acl.memoryBackend());
var roles = ['root','partner','admin','user','read', 'l1ops'];

/**
 * Invoke Tenants Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/status',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/sgStatus',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/suStatus',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/protocol',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/lunos',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/applications',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/icrstatus',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/notificationCategory',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/provider',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/storagePackClasses',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/performanceServiceLevels',
      permissions: ['get']
    }]
  }]);
  acl.allow([{
    roles: roles,
    allows: [{
      resources: '/api/lookups/protectionServiceLevels',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Tenants Policy Allows
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
          message: 'User is not authorized'
        });
      }
    }
  });
};
