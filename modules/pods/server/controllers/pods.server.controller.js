'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  Pod = mongoose.model('Pod'),
  Cluster = mongoose.model('ontap_clusters'),
  Server = mongoose.model('Server'),
  Job = mongoose.model('Job'),
  logger = require(path.resolve('./config/lib/log')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  util = require('util'),
  dbWfa = require('./pods.server.wfa.db.read');

/**
 * Create a pod
 */
exports.create = function (req, res) {
  var pod = new Pod();
  pod.user = req.user;
  pod.name = req.body.name;
  pod.code = req.body.code;
  

  mongoose.model('Site').findById(req.body.siteId).exec(function (err, site) {
    if (err) {
      logger.info('Pod Create: Invalid Site ID');
      return res.status(400).send({
        message: 'Invalid Site ID'
      });
    } else if(!site) {
      logger.info('Pod Create: Invalid Site ID');
      return res.status(400).send({
        message: 'Invalid Site ID'
      });
    } else {
      pod.site = mongoose.Types.ObjectId(site._id);
    }

    //verify the cluster keys
    if(req.body.cluster_keys.length == 0) {
      logger.info('Pod Create: Invalid Site ID');
      return res.status(400).send({
        message: 'At least one Cluster need to be specified'
      });
    } else {
      Cluster.find({ '_id' : {$in : req.body.cluster_keys}}).exec(function(err, clusters) {
        if (err || !clusters) {
          logger.info('Pod Create: Invalid Cluster details');
          return res.status(400).send({
            message: "Invalid Cluster Details"
          });
        } else {
          if(clusters.length != req.body.cluster_keys.length) {
            logger.info('Pod Create: Invalid Cluster details with different length');
            return res.status(400).send({
              message: "Invalid Cluster details, some of the clusters not found"
            });
          } else {
            pod.cluster_keys = req.body.cluster_keys;
            pod.save(function (err) {
              logger.info('Pod pod.save(): Entered');
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                logger.info('Pod pod.save(): Calling Job.create()...');
                Job.create(req, 'pod', function(err, createJobRes) {
                  createJobRes.update('Completed', 'Pod Saved', pod);
                });
                res.json(pod);
              }
            });
          }
        }
      })
    }
    
  });
};

/**
 * Show the current pod
 */
exports.read = function (req, res) {
  res.json(req.pod);
};

/**
 * Update a pod
 */
exports.update = function (req, res) {
  var pod = req.pod;

  pod.name = _.isUndefined(req.body.name) ? pod.name : req.body.name;
  pod.vlansAvailable = _.isUndefined(req.body.vlansAvailable) ? pod.vlansAvailable : req.body.vlansAvailable.toString().split(',');

  // Update used VLANs.
  dbWfa.vlansUsedRead(pod.site.code, pod.code, function(err, vlansUsed) {
    if (err) {
      logger.error('Pod Update: dbWfa.vlansUsedRead() failed (ignoring), Error: ' + err);
    } else {
      logger.info('Pod Update: dbWfa.vlansUsedRead() returned: ' + util.inspect(vlansUsed, {showHidden: false, depth: null}));
      pod.vlansUsed = vlansUsed;
    }
    logger.info('Pod Update: pod.vlansUsed: ' + util.inspect(pod.vlansUsed, {showHidden: false, depth: null}));

    // Rationalise vlansAvailable by removing any VLANs that already exist within the pod.
    pod.vlansAvailable = _.difference(pod.vlansAvailable, pod.vlansUsed);

    logger.info('Pod Update: pod before save: ' + util.inspect(pod, {showHidden: false, depth: null}));
    pod.save(function (err) {
      if (err) {
        logger.error('Pod Update: pod.save() failed. Error: ' + err);
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        logger.info('Pod Update: pod.save() succeeded.');
        Job.create(req, 'pod', function(err, updateJobRes) {
          updateJobRes.update('Completed', 'Pod Updated', pod);
        });
        res.json(pod);
      }
    });
  });
};

/**
 * Delete an pod
 */
exports.delete = function (req, res) {
  var pod = req.pod;

  //check for vFASS dependancy
  Server.find({ 'pod' : mongoose.Types.ObjectId(pod._id) }).exec(function (err, servers) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if(servers.length > 0) {
        return res.status(400).send({
          message: 'Can\'t perform Delete: Please ensure all associated vFASS are deleted'
        });
      } else {
        pod.remove(function (err) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            Job.create(req, 'pod', function(err, deleteJobRes) {
              deleteJobRes.update('Completed', 'Pod Deleted', pod);
            });
            res.json({});
          }
        });
      }
    }
  });
};

/**
 * List of Pods
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  let q = Pod.find().populate('site','name code').populate('cluster_keys', 'name key').exec(function (err, pods) {
    if (err) {
      console.log(err, q);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(pods);
    }
  });
};

/**
 * Pod middleware
 */
exports.podByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Pod is invalid'
    });
  }

  Pod.findById(id).populate('site','name code').populate('cluster_keys', 'name key').exec(function (err, pod) {
    if (err) {
      return next(err);
    } else if (!pod) {
      return res.status(404).send({
        message: 'No pod with that identifier has been found'
      });
    }
    req.pod = pod;
    next();
  });
};
