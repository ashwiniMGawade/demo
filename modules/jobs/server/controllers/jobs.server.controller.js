'use strict';

/**
 * Module dependencies .
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  moment = require('moment'),
  Job = mongoose.model('Job'),
  Tenant = mongoose.model('Tenant'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current job
 */
exports.read = function (req, res) {
  if (!_.includes(req.user.roles, 'root')) {
    var job = req.job.toObject();
    job.jobId = job._id;
    delete job._id;
    delete job.__v;
    res.json(job);
  } else {
    Job.findById(req.job._id, 'user operation objectType payload result status object created updated').exec(function (err, job) {
      res.json(job);
    });
  }
};

/**
 * List of Jobs
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  var startDate = req.query.start ? new Date(moment(req.query.start)): '';
  var endDate = req.query.end ? new Date(moment(req.query.end)) : '';
  var search = req.query.search ? req.query.search : '';

  var query =  Job.find({},  'user partner module operation created updated status object objectType').sort('-created');
  if (startDate && endDate) {
    query.where({'created': {$gte: startDate, $lte: endDate}});
  }
  if (search) {
    query.where({
      $or : [
        {module: new RegExp(".*" + search.replace(/(\W)/g, "\\$1") + ".*", "i")},
        {operation:  new RegExp(".*" + search.replace(/(\W)/g, "\\$1") + ".*", "i")},
        {status:  new RegExp(".*" + search.replace(/(\W)/g, "\\$1") + ".*", "i")},
        {'user.username' : new RegExp(".*" + search.replace(/(\W)/g, "\\$1") + ".*", "i")},
        {'tenant.code': new RegExp(".*" + search.replace(/(\W)/g, "\\$1") + ".*", "i")},
        {'object.code': new RegExp(".*" + search.replace(/(\W)/g, "\\$1") + ".*", "i")}
      ]
    });
  }

  if (_.includes(req.user.roles, 'root')) {
  } else if (_.includes(req.user.roles, 'partner')) {
    query.where({ $or:[ {'tenant.tenantId':req.user.tenant }, {'partner.partnerId':req.user.tenant } ] });
  } else {
    query.where({ 'tenant.tenantId': req.user.tenant });
  }

  query.exec(function (err, jobs) {
    respond(err, jobs);
  });

  function respond(err, jobs) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(jobs);
    }
  }
};

/**
 * Job middleware
 */
exports.jobByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Job is invalid'
    });
  }

  Job.findById(id, 'user operation objectType payload result status object created updated')
  .exec(function (err, job) {
    if (err) {
      return next(err);
    } else if (!job) {
      return res.status(404).send({
        message: 'No job with that identifier has been found'
      });
    }
    req.job = job;
    next();
  });
};
