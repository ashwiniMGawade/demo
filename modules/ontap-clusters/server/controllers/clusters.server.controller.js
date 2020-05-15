'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  Cluster = mongoose.model('ontap_clusters'),
  Pod = mongoose.model('Pod'),
  Job = mongoose.model('Job'),
  logger = require(path.resolve('./config/lib/log')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  util = require('util');

/**
 * Create a cluster
 */
exports.create = function (req, res) {
  var cluster = new Cluster();
  cluster.user = req.user;
  cluster.name = req.body.name;
  cluster.uuid = req.body.uuid;
  cluster.management_ip = req.body.management_ip;
  cluster.provisioning_state = req.body.provisioning_state;
  cluster.applications = req.body.applications || '';
  cluster.dr_enabled = req.body.dr_enabled || false;


  cluster.save(function (err) {
      logger.info('Cluster cluster.save(): Entered');
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        logger.info('Cluster cluster.save(): Calling Job.create()...');
        Job.create(req, 'cluster', function(err, createJobRes) {
          createJobRes.update('Completed', 'Cluster Saved', cluster);
        });
        res.json(cluster);
      }
    });
};

/**
 * Show the current cluster
 */
exports.read = function (req, res) {
  res.json(req.cluster);
};

/**
 * Update a cluster
 */
exports.update = function (req, res) {
  var cluster = req.cluster;

  cluster.name = _.isUndefined(req.body.name) ? cluster.name : req.body.name;
  cluster.uuid = req.body.uuid;
  cluster.management_ip = req.body.management_ip;
  cluster.provisioning_state = req.body.provisioning_state;
  cluster.applications = req.body.applications;
  cluster.dr_enabled = req.body.dr_enabled;

   cluster.save(function (err) {
      logger.info('Cluster cluster.save(): Entered');
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        logger.info('Cluster cluster.save(): Calling Job.create()...');        
        Job.create(req, 'cluster', function(err, createJobRes) {
          createJobRes.update('Completed', 'Cluster Saved', cluster);
        });
        res.json(cluster);
      }
    });
  
};

/**
 * Delete an cluster
 */
exports.delete = function (req, res) {
  var cluster = req.cluster;

  //check for POD dependancy
  Pod.find({ 'cluster_keys' : mongoose.Types.ObjectId(cluster._id) }).exec(function (err, clusters) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if(clusters.length > 0) {
        return res.status(400).send({
          message: 'Can\'t perform Delete: Please ensure all associated clusters are deleted from the pods'
        });
      } else {
        cluster.remove(function (err) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            Job.create(req, 'cluster', function(err, deleteJobRes) {
              deleteJobRes.update('Completed', 'Cluster Deleted', cluster);
            });
            res.json({});
          }
        });
      }
    }
  });
};

/**
 * List of clusters
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  Cluster.find().exec(function (err, clusters) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(clusters);
    }
  });
};

/**
 * Cluster middleware
 */
exports.clusterByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Cluster is invalid'
    });
  }

  Cluster.findById(id).populate('applications').exec(function (err, cluster) {
    if (err) {
      return next(err);
    } else if (!cluster) {
      return res.status(404).send({
        message: 'No Cluster with that identifier has been found'
      });
    }
    req.cluster = cluster;
    next();
  });
};
