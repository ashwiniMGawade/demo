'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  mongoose = require('mongoose'),
  util = require('util'),
  Storagegroup = mongoose.model('Storagegroup'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  clientAPIList = require('./storagegroups.snapshots.server.wfa.ss.list'),
  moment = require('moment');

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
  res.status(errCode).send({
   message: errMessage
  });
};

var getServerDetails = function(req, callback) {
  var args = {
    server: (req.storagegroup.server.code) ? req.storagegroup.server.code : ''
  };

  logger.info('Snapshot list Server Details: Args: ' + util.inspect(args, {showHidden: false, depth: null}));
  clientAPIList.ssServerDetailsExec(args, function (err, serverDetails) {
    if (err) {
      callback(err);
    } else {
      var serverKey = serverDetails[0].key;
      logger.info('Snapshot Server Details: Response from API: ' + util.inspect(serverDetails, {showHidden: false, depth: null}));
      callback(null, serverKey);
    }
  });
};

var getVolumeDetails = function(req, serverKey, callback) {
  var args = {
    serverKey: serverKey,
    storagegroup: (req.storagegroup.code) ? req.storagegroup.code : ''
  };

  logger.info('Snapshot list volume Details: Args: ' + util.inspect(args, {showHidden: false, depth: null}));
  clientAPIList.ssVolumeDetailsExec(args, function (err, volumeDetails) {
    if (err) {
      callback(err);
    } else {
      var volumeKey = volumeDetails[0].key;
      logger.info('Snapshot Volume Details: ' + util.inspect(volumeDetails, {showHidden: false, depth: null}));
      callback(null,volumeKey);
    }
  });
};

var getSnapshots = function(volumeKey, snapshotCode, callback) {
  var args = {
    volumeKey: volumeKey
  };
  if (snapshotCode) {
    args.snapshotCode = snapshotCode;
  }

  logger.info('Snapshot list : Args: ' + util.inspect(args, {showHidden: false, depth: null}));
  clientAPIList.ssListExec(args, function (err, snapshotList) {
    if (err) {
      callback(err);
    } else {
      logger.info('Snapshot List: Response from API for Snapshot List: ' + util.inspect(snapshotList, {showHidden: false, depth: null}));
      callback(null, snapshotList);
    }
  });
};

/**
 * Create a snapshot
 */
exports.create = function (req, res) {
  var clientWfaCreate = require('./storagegroups.snapshots.server.wfa.ss.create');

  var snapshot = {};
  snapshot.storagegroup = req.params.storagegroupId;

  Storagegroup.findById(snapshot.storagegroup)
   .populate('server','name code')
   .populate('user','tenant').exec(function (err, storagegroup) {
      if (err) {
        return respondError(res, 400, errorHandler.getErrorMessage(err));
      }  else if (!snapshot) {
        return respondError(res, 404, 'No Storage Group with that identifier has been found');
      } else {
        snapshot.storagegroup = storagegroup;
        createSnapshot(req, res);
      }
    });

  function createSnapshot(req, res) {
    getServerDetails(req, function(err, serverKey) {
      if (err) {
       return respondError(res, 400, err);
      } else {
        getVolumeDetails(req, serverKey, function(err, volumeKey) {
          if (err) {
            return respondError(res, 400, err);
          } else {
            var args = {
              serverKey: serverKey,
              volumeKey: volumeKey,
              snapshot: 'adhoc.' + moment().format('YYYY-MM-DD_hhmm')
            };
            logger.info('Snapshot Create: Args: ' + util.inspect(args, {showHidden: false, depth: null}));
            var clientWfa = require('./storagegroups.snapshots.server.wfa.ss.create');
            clientWfa.ssCreateExec(args, function (err, resApi) {
              if (err) {
                return respondError(res, 400, err);
              } else {
                res.status(202).send({});
              }
            });
          }
        });
      }
    });
  }
};

/**
 * Delete a snapshot
 */
exports.delete = function (req, res) {
  var clientAPIDelete = require('./storagegroups.snapshots.server.wfa.ss.delete');
  var args = {};
  getServerDetails(req, function(err, serverKey) {
    if (err) {
      return respondError(res, 400, err);
    }
    getVolumeDetails(req, serverKey, function(err, volumeKey) {
      if (err) {
       return respondError(res, 400, err);
      }
      getSnapshots(volumeKey, req.params.snapshotCode, function(err, snapshotList) {
        if (err) {
          return respondError(res, 400, err);
        }
        args.snapshotKey = snapshotList[0].key;
        clientAPIDelete.ssDeleteExec(args, function (err, deleteRes) {
          if (err) {
            return respondError(res, 400, err);
          } else {
            res.status(202).send({});
          }
        });
      });
    });
  });
};

/**
 * List of Snapshots
 */
exports.list = function (req, res) {
  var clientWfa = require('./storagegroups.snapshots.server.wfa.ss.list');
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  getServerDetails(req, function(err, serverKey) {
    if (err) {
      return respondError(res, 400, err);
    }
    getVolumeDetails(req, serverKey, function(err, volumeKey) {
      if (err) {
       return respondError(res, 400, err);
      }
      getSnapshots(volumeKey, null, function (err, snapshotList) {
        if (err) {
          return respondError(res, 400, err);
        } else {
          logger.info('Snapshot List: Response from API for Snapshot List: ' + util.inspect(snapshotList, {showHidden: false, depth: null}));
          //Return only names
          snapshotList = _.map(snapshotList, function(snapshot) { return { "code": snapshot.name }; } );
          res.json(snapshotList);
        }
      });
    });
  });
};
