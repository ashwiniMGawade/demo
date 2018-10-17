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
 * Invoke Admin Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.user.create,
    allows: [{
      resources: '/api/users',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.user.list,
    allows: [{
      resources: '/api/users',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.user.read,
    allows: [{
      resources: '/api/users/:userId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.user.update,
    allows: [{
      resources: '/api/users/:userId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.user.delete,
    allows: [{
      resources: '/api/users/:userId',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If Admin Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.model && req.user) {
    //Root and l1ops gets to access all objects
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.model.tenant && req.model.tenant.id === req.user.tenant.toString()) ||
                  (req.model.partner && req.model.partner.id === req.user.tenant.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.model.tenant || req.model.tenant.id !== req.user.tenant.toString()) {
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
