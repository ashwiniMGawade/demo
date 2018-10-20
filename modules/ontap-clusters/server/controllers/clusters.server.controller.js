'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  Cluster = mongoose.model('ontap_clusters'),
  Server = mongoose.model('Server'),
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
  cluster.key = req.body.key;
  cluster.management_ip = req.body.management_ip;
  cluster.provisioning_state = req.body.provisioning_state;
  cluster.rest_uri = req.body.rest_uri;


  cluster.save(function (err) {
      logger.info('Cluster cluster.save(): Entered');
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        logger.info('Cluster cluster.save(): Calling Job.create()...');
        logger.info('Cluster cluster.save(): req: ' + util.inspect(req, {showHidden: false, depth: null}));
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
  cluster.management_ip = req.body.management_ip;
  cluster.provisioning_state = req.body.provisioning_state;
  cluster.rest_uri = req.body.rest_uri;

   cluster.save(function (err) {
      logger.info('Cluster cluster.save(): Entered');
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        logger.info('Cluster cluster.save(): Calling Job.create()...');
        logger.info('Cluster cluster.save(): req: ' + util.inspect(req, {showHidden: false, depth: null}));
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
  // Server.find({ 'cluster' : mongoose.Types.ObjectId(cluster._id) }).exec(function (err, servers) {
  //   if (err) {
  //     return res.status(400).send({
  //       message: errorHandler.getErrorMessage(err)
  //     });
  //   } else {
  //     if(servers.length > 0) {
  //       return res.status(400).send({
  //         message: 'Can\'t perform Delete: Please ensure all associated vFASS are deleted'
  //       });
  //     } else {
  //       cluster.remove(function (err) {
  //         if (err) {
  //           return res.status(400).send({
  //             message: errorHandler.getErrorMessage(err)
  //           });
  //         } else {
  //           Job.create(req, 'cluster', function(err, deleteJobRes) {
  //             deleteJobRes.update('Completed', 'Cluster Deleted', cluster);
  //           });
  //           res.json({});
  //         }
  //       });
  //     }
  //   }
  // });
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

  Cluster.findById(id).exec(function (err, cluster) {
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
