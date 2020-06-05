'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  util = require('util'),
  mongoose = require('mongoose'),
  Application = mongoose.model('Application'),
  // Subtenant = mongoose.model('Subtenant'),
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
 * Create a application
 */
exports.create = function (req, res) {
  var application = new Application();
  application.user = req.user;
  application.code = req.body.code;
  application.name = req.body.name;


  application.save(function (err) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      Job.create(req, 'application', function(err, createJobRes) {
        application
        .populate("user", "username", function(err, applicationPopulated) {
          if (err) {
            createJobRes.update('Failed', err, applicationPopulated);
            logger.info('Application Create: Populate Error: ' + err);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            application = applicationPopulated;
            // logger.info('Application Create: Application Populated: ' + util.inspect(applicationPopulated, {showHidden: false, depth: null}));
            createJobRes.update('Completed', null, application);
          }
        });
      });
      res.json(application);
    }
  });
};

/**
 * Show the current application
 */
exports.read = function (req, res) {
  res.json(req.application);
};

/**
 * Update a application
 */
exports.update = function (req, res) {
  var application = req.application;

  application.name = req.body.name;

  application.save(function (err) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      Job.create(req, 'application', function(err, updateJobRes) {
        application
        .populate('user', 'username', function(err, applicationPopulated) {
          if (err){
            updateJobRes.update('Failed', err, applicationPopulated);
            logger.info('Application Update: Populate Error: ' + err);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            application = applicationPopulated;
            logger.info('Application Update: Application Populated: ' + util.inspect(application, {showHidden: false, depth: null}));
            updateJobRes.update('Completed', null, application);
            res.json(application);
          }
        });
      });
    }
  });
};

/**
 * Delete a application
 */
exports.delete = function (req, res) {
  var application = req.application;

  //check self/tenant dependancy
  // Application.find({ 'partner' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, applications) {
  //   if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
  //   if (tenants.length > 0)
  //     return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated applications are deleted');
  //   //check user dependancy
  //   User.find({ 'tenant' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, users) {
  //     if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
  //     if (users.length > 0)
  //       return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated users are deleted');
  //     //check subscription dependancy
  //     Subscription.find({ 'tenant' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, subscriptions) {
  //       if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
  //       if(subscriptions.length > 0)
  //         return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated subscriptions are deleted!');
  //       //check subtenant dependancy
  //       Subtenant.find({ 'tenant' : mongoose.Types.ObjectId(tenant._id) }).exec(function (err, subtenants) {
  //         if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
  //         if(subtenants.length > 0)
  //           return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated subtenants are deleted');
  //         //delete application when no dependancy
  //         application.remove(function (err) {
  //           if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
  //           Job.create(req, 'tenant', function(err, deleteJobRes) {
  //             deleteJobRes.update('Completed', 'Application Deleted', application);
  //           });
  //           res.json({});
  //         });
  //       });
  //     });
  //   });
  // });
};

/**
 * List of Applications
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  Application.find().populate("user", "username").exec(function (err, applications) {
    respond(err, applications);
  }); 

  function respond(err, applications) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(applications);
    }
  }
};

/**
 * Application middleware
 */
exports.applicationByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Application is invalid'
    });
  }

  Application.findById(id).populate('user', 'username').exec(function (err, application) {
    if (err) {
      return next(err);
    } else if (!application) {
      return res.status(404).send({
        message: 'No application with that identifier has been found'
      });
    }
    req.application = application;
    next();
  });
};
