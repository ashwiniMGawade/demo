'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  mongoose = require('mongoose'),
  Subtenant = mongoose.model('Subtenant'),
  Server = mongoose.model('Server'),
  Job = mongoose.model('Job'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
  res.status(errCode).send({
   message: errMessage
  });
};

/**
 * Create a subtenant
 */
exports.create = function (req, res) {
  var subtenant = new Subtenant();
  subtenant.user = req.user;
  subtenant.name = req.body.name;
  subtenant.code = req.body.code;

  if ((_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'partner')) && req.body.tenantId) {
    subtenant.tenant = mongoose.Types.ObjectId(req.body.tenantId);
  } else {
    subtenant.tenant = subtenant.user.tenant;
  }
  subtenant.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Job.create(req, 'subtenant', function(err, createJobRes) {
        var subtenantCreateJob = createJobRes;
        subtenant
        .populate('user', 'username')
        .populate('tenant partner', 'name code', function (err, subtenantPopulated) {
          if (err){
            subtenantCreateJob.update('Failed', err, subtenantPopulated);
            logger.info('Subtenant Create: Populate Error: ' + err);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            subtenant = subtenantPopulated;
            logger.info('Subtenant Create: Subtenant Populated: ' + util.inspect(subtenant, {showHidden: false, depth: null}));
            subtenantCreateJob.update('Completed', null, subtenant);
            res.json(subtenant);
          }
        });
      });
    }
  });
};

/**
 * Show the current subtenant
 */
exports.read = function (req, res) {
  res.json(req.subtenant);
};

/**
 * Update a subtenant
 */
exports.update = function (req, res) {
  var subtenant = req.subtenant;
  subtenant.name = req.body.name;
  subtenant.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Job.create(req, 'subtenant', function(err, createRes) {
        var subtenantUpdateJob = createRes;
        subtenant
        .populate('user', 'username')
        .populate('tenant partner', 'name code', function (err, subtenantPopulated) {
          if (err) {
            subtenantUpdateJob.update('Failed', err, subtenantPopulated);
            logger.info('Subtenant Update: Populate Error: ' + err);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            subtenant = subtenantPopulated;
            logger.info('Subtenant Update: Subtenant Populated: ' + util.inspect(subtenant, {showHidden: false, depth: null}));
            subtenantUpdateJob.update('Completed', null, subtenant);
            res.json(subtenant);
          }
        });
      });
    }
  });
};

/**
 * Delete an subtenant
 */
exports.delete = function (req, res) {
  var subtenant = req.subtenant;

  //check for dependent vFASs
  Server.find({ 'subtenant' : mongoose.Types.ObjectId(subtenant._id) }).exec(function (err, servers) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if(servers.length > 0) {
        return res.status(400).send({
          message: 'Can\'t perform Delete: Please ensure all associated vFASs are deleted'
        });
      } else {
        subtenant.remove(function (err) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            Job.create(req, 'subtenant', function(err, deleteJobRes) {
              deleteJobRes.update('Completed', 'Subtenant Deleted', subtenant);
            });
            res.json({});
          }
        });
      }
    }
  });
};

/**
 * List of Subtenants
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
    Subtenant.find().populate('tenant','name code')
                    .populate('partner', 'name code').exec(function (err, subtenants) {
      respond(err, subtenants);
    });
  } else if (_.includes(req.user.roles, 'partner')) {
    Subtenant.find( { $or:[ {'tenant':req.user.tenant }, {'partner':req.user.tenant } ] } )
             .populate('tenant','name code')
             .populate('partner', 'name code').exec(function (err, subtenants) {
      respond(err, subtenants);
    });
  } else {
    Subtenant.find({ 'tenant': req.user.tenant })
             .populate('tenant','name code')
             .populate('partner', 'name code').exec(function (err, subtenants) {
      respond(err, subtenants);
    });
  }

  function respond(err, subtenants) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(subtenants);
    }
  }
};

/**
 * Subtenant middleware
 */
exports.subtenantByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Subtenant is invalid'
    });
  }

  Subtenant.findById(id).populate('tenant','name code').populate('partner', 'name code').exec(function (err, subtenant) {
    if (err) {
      return next(err);
    } else if (!subtenant) {
      return res.status(404).send({
        message: 'No subtenant with that identifier has been found'
      });
    }
    req.subtenant = subtenant;
    next();
  });
};
