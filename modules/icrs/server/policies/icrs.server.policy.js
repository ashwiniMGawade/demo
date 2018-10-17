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
 * Invoke Icrs Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.icr.create,
    allows: [{
      resources: '/api/icrs',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.icr.list,
    allows: [{
      resources: '/api/icrs',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.icr.read,
    allows: [{
      resources: '/api/icrs/:icrId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.icr.update,
    allows: [{
      resources: '/api/icrs/:icrId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.icr.delete,
    allows: [{
      resources: '/api/icrs/:icrId',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If Icrs Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.icr && req.user) {
    //Root gets to access all objects
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.icr.tenant && req.icr.tenant.id === req.user.tenant.toString()) ||
                  (req.icr.partner && req.icr.partner.id === req.user.tenant.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.icr.tenant || req.icr.tenant.id !== req.user.tenant.toString()) {
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
