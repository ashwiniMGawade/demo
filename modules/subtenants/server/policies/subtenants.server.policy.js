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
 * Invoke Subtenants Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.subtenant.create,
    allows: [{
      resources: '/api/subtenants',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.subtenant.list,
    allows: [{
      resources: '/api/subtenants',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.subtenant.read,
    allows: [{
      resources: '/api/subtenants/:subtenantId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.subtenant.update,
    allows: [{
      resources: '/api/subtenants/:subtenantId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.subtenant.delete,
    allows: [{
      resources: '/api/subtenants/:subtenantId',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If Subtenants Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.subtenant && req.user) {
    //Root gets to access all objects
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.subtenant.tenant && req.subtenant.tenant.id === req.user.tenant.toString()) ||
                  (req.subtenant.partner && req.subtenant.partner.id === req.user.tenant.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.subtenant.tenant || req.subtenant.tenant.id !== req.user.tenant.toString()) {
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
