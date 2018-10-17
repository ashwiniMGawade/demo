'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Sites Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['root', 'l1ops'],
    allows: [{
      resources: '/api/storagegraphs',
      permissions: '*'
    }]
  }, {
    roles: ['user','admin','read'],
    allows: [{
      resources: '/api/storagegraphs',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Sites Policy Allows
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
