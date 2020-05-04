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
 * Invoke Tenants Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.application.create,
    allows: [{
      resources: '/api/applications',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.application.list,
    allows: [{
      resources: '/api/applications',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.application.read,
    allows: [{
      resources: '/api/applications/:applicationId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.application.update,
    allows: [{
      resources: '/api/applications/:applicationId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.application.delete,
    allows: [{
      resources: '/api/applications/:applicationId',
      permissions: ['delete']
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

  if (req.application && req.user) {
    //Root gets to access all objects
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.application.id === req.user.application.toString()) ||
                  (req.application.partner && req.application.partner.id === req.user.application.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.application || req.application.id !== req.user.application.toString()) {
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
