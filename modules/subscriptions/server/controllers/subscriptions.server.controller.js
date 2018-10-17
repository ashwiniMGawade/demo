'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  mongoose = require('mongoose'),
  featuresSettings = require(path.resolve('./config/features')),
  Job = mongoose.model('Job'),
  Subscription = mongoose.model('Subscription'),
  Server = mongoose.model('Server'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
  res.status(errCode).send({
  message: errMessage
  });
};

/**
 * Create a subscription
 */
exports.create = function (req, res) {
  var subscription = new Subscription();

  subscription.user = req.user;
  subscription.name = req.body.name;
  subscription.code = req.body.code;
  subscription.description = req.body.description;
  subscription.url = req.body.url;

  if (req.body.siteId) {
    if (mongoose.Types.ObjectId.isValid(req.body.siteId)) {
      subscription.site =  mongoose.Types.ObjectId(req.body.siteId);
    } else {
      subscription.site = mongoose.Types.ObjectId();
    }
  }

  if (req.body.tenantId) {
    if (mongoose.Types.ObjectId.isValid(req.body.tenantId)) {
      subscription.tenant =  mongoose.Types.ObjectId(req.body.tenantId);
    } else {
      subscription.tenant = mongoose.Types.ObjectId();
    }
  }

  if (_.includes(req.user.roles, 'root') && req.body.partnerId) {
    subscription.partner = mongoose.Types.ObjectId(req.body.partnerId);
  } else if(_.includes(req.user.roles, 'partner') && req.user.tenant) {
    subscription.partner = mongoose.Types.ObjectId(req.user.tenant);
  }

  if (featuresSettings.paymentMethod.prePaid && req.body.storagePack) {
    subscription.storagePack = req.body.storagePack;
  }
  mongoose.model('Tenant').findById(subscription.tenant).exec(function (err, tenant) {
    var roles = (req.user) ? req.user.roles : ['guest'];

    if (err) {
      return respondError(res, 400, 'Invalid Tenant ID');
    } else if (!tenant) {
      return respondError(res, 400, 'Invalid Tenant ID');
    } else {
      //Root gets to access all tenants report
      if (_.includes(roles, 'root')) {
      //Partner gets to access all objects under tenancy and his partner tenancy
      } else if ( _.includes(roles, 'partner') &&
                  ( (tenant._id.toString() === req.user.tenant.toString()) ||
                    (tenant.partner && tenant.partner.toString() === req.user.tenant.toString()) ) ) {
      //Others gets to access all objects under their tenancy
      } else if ( tenant._id.toString() !== req.user.tenant.toString()) {
        return respondError(res, 403, 'User is not authorized');
      }
    }

    subscription.save(function (err) {
      if (err) {
        logger.info(err);
        var errMsg = {};
        _.forOwn(err.errors, function(error, field) {
          logger.info(field, error.message);
          errMsg[field] = error.message;
        });
        return respondError(res, 400, errMsg);
      } else {
        var subscriptionCreateJob;
        Job.create(req, 'subscription', function(err, createRes) {
          subscriptionCreateJob = createRes;
          subscription
          .populate('tenant','name code')
          .populate('user', 'username')
          .populate('partner', 'name code')
          .populate('site','name code', function (err, subscriptionPopulated) {
            if (err){
              subscriptionCreateJob.update('Failed', err, subscriptionPopulated);
              logger.info('Subscription Create: Populate Error: ' + err);
              return respondError(res, 400, errorHandler.getErrorMessage(err));
            } else {
              subscription = subscriptionPopulated;
              logger.info('Subscription Create: Subscription Populated: ' + util.inspect(subscription, {showHidden: false, depth: null}));
              subscriptionCreateJob.update('Completed', null, subscriptionPopulated);
              res.json(subscription);
            }
          });
        });
      }
    });
  });
};

/**
 * Show the current subscription
 */
exports.read = function (req, res) {
  res.json(req.subscription);
};

/**
 * Update a subscription
 */
exports.update = function (req, res) {
  var subscription = req.subscription;
  subscription.name = _.isUndefined(req.body.name) ? subscription.name : req.body.name;
  subscription.description = _.isUndefined(req.body.description) ? subscription.description : req.body.description;
  subscription.url = _.isUndefined(req.body.url) ? subscription.url : req.body.url;

  subscription.save(function (err) {
    if (err) {
      var errMsg = {};
      _.forOwn(err.errors, function(error, field) {
        logger.info(field, error.message);
        errMsg[field] = error.message;
      });
      return respondError(res, 400, errMsg);
    } else {
      var subscriptionUpdateJob;
      Job.create(req, 'subscription', function(err, createRes) {
        subscriptionUpdateJob = createRes;
        subscription.populate('tenant','name code')
        .populate('partner', 'name code')
        .populate('site','name code', function (err, subscriptionPopulated) {
          if (err) {
            subscriptionUpdateJob.update('Failed', err, subscriptionPopulated);
            logger.info('Subscription Update: Populate Error: ' + err);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            subscription = subscriptionPopulated;
            logger.info('Subscription Update: Subscription Populated: ' + util.inspect(subscription, {showHidden: false, depth: null}));
            subscriptionUpdateJob.update('Completed', null, subscriptionPopulated);
            res.json(subscription);
          }
        });
      });
    }
  });
};

/**
 * Delete a subscription
 */
exports.delete = function (req, res) {
  var subscription = req.subscription;

  //check for dependent vFASs
  Server.find({ 'subscription' : mongoose.Types.ObjectId(subscription._id) }).exec(function (err, servers) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      if(servers.length > 0) {
        return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated servers are deleted');
      } else {
        var subscriptionDeleteJob;
        Job.create(req, 'subscription', function(err, createRes) {
          subscriptionDeleteJob = createRes;
           subscription.remove(function (err) {
            if (err) {
              subscriptionDeleteJob.update('Failed', err, subscription);
              return respondError(res, 400, errorHandler.getErrorMessage(err));
            } else {
              subscriptionDeleteJob.update('Completed', null, subscription);
              res.json({});
            }
          });
        });
      }
    }
  });
};

/**
 * List of Subscriptions
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var query =  Subscription.find({})
      .populate('tenant','name code')
      .populate('partner', 'name code')
      .populate('site','name code');

  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
  } else if (_.includes(req.user.roles, 'partner')) {
    query.where({ $or:[ {'tenant':req.user.tenant }, {'partner':req.user.tenant } ] });
  } else {
    query.where({ 'tenant': req.user.tenant });
  }

  query.exec(function (err, subscriptions) {
    respond(err, subscriptions);
  });

  function respond(err, subscriptions) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(subscriptions);
    }
  }
};

/**
 * Subscription middleware
 */
exports.subscriptionByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return respondError(res, 400, 'Subscription is invalid');
  }

  Subscription.findById(id)
  .populate('tenant','name code')
  .populate('partner', 'name code')
  .populate('site','name code').exec(function (err, subscription) {
    if (err) {
      return next(err);
    } else if (!subscription) {
      return respondError(res, 404, 'No subscription with that identifier has been found');
    }
    req.subscription = subscription;
    next();
  });
};
