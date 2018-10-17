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
 * Invoke Servers Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.server.create,
    allows: [{
      resources: '/api/servers',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.server.list,
    allows: [{
      resources: '/api/servers',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.server.read,
    allows: [{
      resources: '/api/servers/:serverId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.server.update,
    allows: [{
      resources: '/api/servers/:serverId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.server.delete,
    allows: [{
      resources: '/api/servers/:serverId',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If Servers Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.server && req.user) {
    //Root gets to access all objects
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.server.tenant && req.server.tenant.id === req.user.tenant.toString()) ||
                  (req.server.partner && req.server.partner.id === req.user.tenant.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.server.tenant || req.server.tenant.id !== req.user.tenant.toString()) {
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
