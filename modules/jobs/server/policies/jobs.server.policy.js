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
 * Invoke jobs Permissions
 */
exports.invokeRolesPolicies = function () {  
  acl.allow([{
    roles: featuresSettings.roles.job.create,
    allows: [{
      resources: '/api/jobs',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.job.list,
    allows: [{
      resources: '/api/jobs',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.job.read,
    allows: [{
      resources: '/api/jobs/:jobId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.job.update,
    allows: [{
      resources: '/api/jobs/:jobId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.job.delete,
    allows: [{
      resources: '/api/jobs/:jobId',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If jobs Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.job && req.user) {
    //Root gets to access all objects
    if (_.includes(roles, 'root')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.job.tenant && req.job.tenant.tenantId && req.job.tenant.tenantId.toString() === req.user.tenant.toString()) ||
                  (req.job.partner && req.job.partner.partnerId && req.job.partner.partnerId.toString() === req.user.tenant.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.job.tenant || ( req.job.tenant.tenantId ? req.job.tenant.tenantId: req.job.tenant).toString() !== req.user.tenant.toString()) {
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
