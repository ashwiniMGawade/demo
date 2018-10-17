'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  util = require('util'),
  mongoose = require('mongoose'),
  Tenant = mongoose.model('Tenant'),
  Subtenant = mongoose.model('Subtenant'),
  Subscription = mongoose.model('Subscription'),
  User = mongoose.model('User'),
  Job = mongoose.model('Job'),
  logger = require(path.resolve('./config/lib/log')),
  featuresSettings = require(path.resolve('./config/features')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
  res.status(errCode).send({
   message: errMessage
  });
};

/**
 * Create a tenant
 */
exports.create = function (req, res) {
  var tenant = new Tenant();
  tenant.user = req.user;
  tenant.code = req.body.code;
  tenant.name = req.body.name;

  //initialize annotation when setting is enabled
  if (featuresSettings.tenant.annotation.enabled) {
    tenant.annotation = req.body.annotation;
  }

  /** Set the partnerId
  *  If root user sends the request then partnerId can specified in the request body
  *  If partner user sends the request then partnerId will be user's tenant Id
  */
  if (_.includes(req.user.roles, 'root') && req.body.partnerId) {
    tenant.partner = mongoose.Types.ObjectId(req.body.partnerId);
  } else if(_.includes(req.user.roles, 'partner') && req.user.tenant) {
    tenant.partner = mongoose.Types.ObjectId(req.user.tenant);
  }

  tenant.save(function (err) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      Job.create(req, 'tenant', function(err, createJobRes) {
        tenant
        .populate("user", "username")
        .populate('partner', 'name code', function(err, tenantPopulated) {
          if (err) {
            createJobRes.update('Failed', err, tenantPopulated);
            logger.info('Tenant Create: Populate Error: ' + err);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            tenant = tenantPopulated;
            logger.info('Tenant Create: Tenant Populated: ' + util.inspect(tenant, {showHidden: false, depth: null}));
            createJobRes.update('Completed', null, tenant);
          }
        });
      });
      var subtenant = new Subtenant();
      subtenant.code = "def";
      subtenant.name = "Default Subtenant";
      subtenant.tenant = tenant;
      subtenant.partner = tenant.partner;
      subtenant.user = tenant.user;
      subtenant.save(function(err) {
        if (err){
          logger.info("Error in creating a Default Subtenant: " + err);
        } else {
          Job.create(req, 'subtenant', function(err, createJobRes) {
            subtenant
            .populate("user", "username")
            .populate('partner', 'name code', function(err, subtenantPopulated) {
              if (err) {
                logger.info('Default subtenant Create: Populate Error: ' + err);
              } else {
                createJobRes.update('Completed', 'Default Subtenant Saved', subtenantPopulated);
              }
              res.json(tenant);
            });
          });
        }
      });

    }
  });
};

/**
 * Show the current tenant
 */
exports.read = function (req, res) {
  res.json(req.tenant);
};

/**
 * Update a tenant
 */
exports.update = function (req, res) {
  var tenant = req.tenant;

  tenant.name = req.body.name;

  //update annotation when setting is enabled
  if (featuresSettings.tenant.annotation.enabled) {
    tenant.annotation = req.body.annotation;
  }
  tenant.save(function (err) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      Job.create(req, 'tenant', function(err, updateJobRes) {
        tenant
        .populate('user', 'username')
        .populate('partner', 'name code', function(err, tenantPopulated) {
          if (err){
            updateJobRes.update('Failed', err, tenantPopulated);
            logger.info('Tenant Update: Populate Error: ' + err);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            tenant = tenantPopulated;
            logger.info('Tenant Update: Tenant Populated: ' + util.inspect(tenant, {showHidden: false, depth: null}));
            updateJobRes.update('Completed', null, tenant);
            res.json(tenant);
          }
        });
      });
    }
  });
};

/**
 * Delete a tenant
 */
exports.delete = function (req, res) {
  var tenant = req.tenant;

  //check self/tenant dependancy
  Tenant.find({ 'partner' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, tenants) {
    if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
    if (tenants.length > 0)
      return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated tenants are deleted');
    //check user dependancy
    User.find({ 'tenant' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, users) {
      if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
      if (users.length > 0)
        return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated users are deleted');
      //check subscription dependancy
      Subscription.find({ 'tenant' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, subscriptions) {
        if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
        if(subscriptions.length > 0)
          return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated subscriptions are deleted!');
        //check subtenant dependancy
        Subtenant.find({ 'tenant' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, subtenants) {
          if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
          if(subtenants.length > 0)
            return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated subtenants are deleted');
          //delete tenant when no dependancy
          tenant.remove(function (err) {
            if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
            Job.create(req, 'tenant', function(err, deleteJobRes) {
              deleteJobRes.update('Completed', 'Tenant Deleted', tenant);
            });
            res.json({});
          });
        });
      });
    });
  });
};

/**
 * List of Tenants
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
    Tenant.find().populate('partner', 'name code').exec(function (err, tenants) {
      respond(err, tenants);
    });
  } else if (_.includes(req.user.roles, 'partner')) {
    Tenant.find( { $or:[ {'_id':req.user.tenant }, {'partner':req.user.tenant } ] } )
          .populate('partner', 'name code').exec(function (err, tenants) {
      respond(err, tenants);
    });
  } else {
    Tenant.findById(req.user.tenant).populate('partner', 'name code').exec(function (err, tenant) {
      respond(err, [tenant]);
    });
  }

  function respond(err, tenants) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(tenants);
    }
  }
};

/**
 * Tenant middleware
 */
exports.tenantByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Tenant is invalid'
    });
  }

  Tenant.findById(id).populate('partner', 'name code').exec(function (err, tenant) {
    if (err) {
      return next(err);
    } else if (!tenant) {
      return res.status(404).send({
        message: 'No tenant with that identifier has been found'
      });
    }
    req.tenant = tenant;
    next();
  });
};
