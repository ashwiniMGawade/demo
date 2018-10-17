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
 * Invoke Storagegroups Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: featuresSettings.roles.storagegroup.create,
    allows: [{
      resources: '/api/storagegroups',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.storagegroup.list,
    allows: [{
      resources: '/api/storagegroups',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.storagegroup.read,
    allows: [{
      resources: '/api/storagegroups/:storagegroupId',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.storagegroup.update,
    allows: [{
      resources: '/api/storagegroups/:storagegroupId',
      permissions: ['put']
    }]
  }, {
    roles: featuresSettings.roles.storagegroup.delete,
    allows: [{
      resources: '/api/storagegroups/:storagegroupId',
      permissions: ['delete']
    }]
  }, {
    roles: featuresSettings.roles.snapshot.create,
    allows: [{
      resources: '/api/storagegroups/:storagegroupId/snapshots',
      permissions: ['post']
    }]
  }, {
    roles: featuresSettings.roles.snapshot.list,
    allows: [{
      resources: '/api/storagegroups/:storagegroupId/snapshots',
      permissions: ['get']
    }]
  }, {
    roles: featuresSettings.roles.snapshot.delete,
    allows: [{
      resources: '/api/storagegroups/:storagegroupId/snapshots/:snapshotCode',
      permissions: ['delete']
    }]
  }]);
};

/**
 * Check If Storagegroups Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (roles.indexOf('guest') !== -1) {
    return res.status(401).json({
      message: 'Session has expired, please login again to access the resource'
    });
  }

  if (req.storagegroup && req.user) {    
    //Root gets to access all objects
    if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
    //Partner gets to access all objects under tenancy and his partner tenancy
    } else if ( _.includes(roles, 'partner') &&
                ( (req.storagegroup.tenant && req.storagegroup.tenant.id === req.user.tenant.toString()) ||
                  (req.storagegroup.partner && req.storagegroup.partner.id === req.user.tenant.toString()) ) ) {
    //Others gets to access all objects under their tenancy
    } else if ( !req.storagegroup.tenant || req.storagegroup.tenant.id !== req.user.tenant.toString()) {
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
