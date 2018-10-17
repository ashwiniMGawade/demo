'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  mongoose = require('mongoose'),
  Job = mongoose.model('Job'),
  util = require('util'),
  Storagegroup = mongoose.model('Storagegroup'),
  config = require(path.resolve('./config/config')),
  Storageunit = mongoose.model('Storageunit'),

  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var saveStoragegroup = function(storagegroup, from, callback) {
  callback = callback || function(){};
  storagegroup.save(function (err, storagegroupSaved) {
    if (err) {
      logger.info(from + ': Failed to save Storagegroup object: ' + err);
    } else {
      storagegroup = storagegroupSaved;
      logger.info(from + ': Storage Group Saved Successfully');
      callback();
    }
  });
};

var handleErrorFromWFA = function(storagegroup) {
  logger.info("Error on WFA, moving status to Contact Support");
  storagegroup.status = 'Contact Support';
  saveStoragegroup(storagegroup, "Error on WFA");
};

var respond = function(res, data) {
  res.json(data);
};

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
    res.status(errCode).send({
     message: errMessage
    });
};

/**
 * Create a storagegroup
 */
exports.create = function (req, res) {
  var clientWfa = require('./storagegroups.server.wfa.sg.create');
  var sgCreateJob;

  var storagegroup = new Storagegroup();
  storagegroup.user = req.user;
  storagegroup.name = req.body.name;
  storagegroup.code = req.body.code;
  storagegroup.annotation = req.body.annotation;
  storagegroup.tier = req.body.tier;
  storagegroup.snapshotPolicy = req.body.snapshotPolicy;

  if (req.body.serverId) {
    if (mongoose.Types.ObjectId.isValid(req.body.serverId)) {
      storagegroup.server = mongoose.Types.ObjectId(req.body.serverId);
    } else {
      storagegroup.server = mongoose.Types.ObjectId();
    }
  }

  Storagegroup.count({ 'server': storagegroup.server },function(err, sgCount){
    if(sgCount >= 20){
      return respondError(res, 400, "Maximum Storage Groups per Storage Array is 20");
    }
    storagegroup.validate(function (err) {
      if (err) {
        var errMsg = {};
        _.forOwn(err.errors, function (error, field) {
          logger.info(field, error.message);
          errMsg[field] = error.message;
        });
        return respondError(res, 400, errMsg);
      } else {
        Job.create(req, 'storagegroup', function(err, createJobRes) {
          sgCreateJob = createJobRes;
          storagegroup.save(function (err) {
            if (err) {
              sgCreateJob.update('Failed', "Err on Save : " + err, storagegroup);
              return respondError(res, 400, errorHandler.getErrorMessage(err));
            } else {
              storagegroup.populate('tenant','name code')
                          .populate('user', 'username')
                          .populate('partner', 'name code')
                          .populate('server', 'name code')
                          .populate('subscription', 'name code')
                          .populate('subtenant', 'name code', function (err, storagegroupPopulated) {
                if (err) {
                  sgCreateJob.update('Failed', "Err on Populate : " + err, storagegroup);
                  return respondError(res, 400, errorHandler.getErrorMessage(err));
                } else {
                  storagegroup = storagegroupPopulated;
                  res.json(storagegroup);
                  createSg();
                }
              });
            }
          });
        });
      }
    });
  });

  function createSg() {
    var jobId;
    var args = {
      code: storagegroup.code,
      annotation: (storagegroup.annotation) ? storagegroup.annotation : '',
      server: (storagegroup.server.code) ? storagegroup.server.code : '',
      tier: storagegroup.tier,
      snapshotPolicy: storagegroup.snapshotPolicy
    };

    logger.info('StrGroup Create: Args: ' + util.inspect(args, {showHidden: false, depth: null}));
    clientWfa.sgCreateExec(args, function (err, resWfa) {
      if (err) {
        sgCreateJob.update('Failed', "Err on WFA : " + err, storagegroup);
        handleErrorFromWFA(storagegroup);
      } else {
        jobId = resWfa.jobId;
        logger.info('StrGroup Create: Response from WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilCreated(jobId);
      }
    });
  }

  function untilCreated(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.sgCreateStatus(args, function (err, resWfa) {
      if (err) {
        sgCreateJob.update('Failed', "Failed to Obtain Status from WFA, Error : " + err, storagegroup);
        logger.info('StrGroup Create: Failed to obtain status, Job ID: ' + jobId);
        handleErrorFromWFA(storagegroup);
      } else {
        if (resWfa.jobStatus === 'FAILED') {
          logger.info('StrGroup Create: Failed to create, Job ID: ' + jobId);
          sgCreateJob.update('Failed', "Recieved Failed Status from WFA, Error : " + err, storagegroup);
          handleErrorFromWFA(storagegroup);
        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('StrGroup Create: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilCreated(jobId); }, config.wfa.refreshRate);
        } else {
          storagegroup.status = 'Operational';
          sgCreateJob.update('Completed', 'Storage Group Operational', storagegroup);
          saveStoragegroup(storagegroup, 'StrGroup Create');
        }
      }
    });
  }

};

/**
 * Show the current storagegroup
 */
exports.read = function (req, res) {
  var dbWfa = require('./storagegroups.server.wfa.db.read.js');
  var storagegroup = req.storagegroup;

  storagegroup.populate('tenant','name code')
              .populate('partner', 'name code')
              .populate('server', 'name code')
              .populate('subscription', 'name code')
              .populate('subtenant', 'name code', function (err, storagegroupPopulated) {
    if (err) {
      logger.info('StrGroup Read: Populate Error: ' + err);
      return respondError(res, 404, "Error on reading Storage Group");
    } else {
      storagegroup = storagegroupPopulated;
      dbWfa.sgRead(storagegroup, function (err, sg) {
        var storagegroupObj = storagegroup.toObject();

        storagegroupObj.sizeUsed = '0';
        storagegroupObj.sizePresented = '0';
        storagegroupObj.sizeSnapshot = '0';
        storagegroupObj.sizeVolume = '0';

        if (err) {
          logger.info('StrGroup Read: Failed to read from WFA, Error: ' + err);
        } else {

          if (sg.usedSize) {
            storagegroupObj.sizeUsed = _.toInteger(sg.usedSize / 1024);
          }

          if (sg.presentedSize) {
            storagegroupObj.sizePresented = _.toInteger(sg.presentedSize / 1024);
          }

          if (sg.snapshotSize) {
            storagegroupObj.sizeSnapshot = _.toInteger(sg.snapshotSize / 1024);
          }

          if (sg.volumeSize) {
            storagegroupObj.sizeVolume = _.toInteger(sg.volumeSize / 1024);
          }
        }
        storagegroupObj.storagegroupId = storagegroupObj._id;
        delete storagegroupObj.user;
        delete storagegroupObj.created;
        delete storagegroupObj._id;
        delete storagegroupObj.__v;
        res.json(storagegroupObj);
      });
    }
  });
};

/**
 * Update a storagegroup
 */
exports.update = function (req, res) {
  var wfaUpdateRequired = false;
  var clientWfa = require('./storagegroups.server.wfa.sg.update');
  var sgUpdateJob;
  var storagegroup = req.storagegroup;

  //If the request is from fix page and its root, he can modify the following parameters
  if(req.body.fromFix && _.includes(req.user.roles, 'root')){

    logger.info('SG Fix: Storagegroup Object: ' + util.inspect(storagegroup, {showHidden: false, depth: null}));
    logger.info('SG Fix: Request Body: ' + util.inspect(req.body, {showHidden: false, depth: null}));

    storagegroup.status = _.isUndefined(req.body.status) ? storagegroup.status : req.body.status ;

    Job.create(req, 'storagegroup', function(err, updateJobRes) {
    sgUpdateJob = updateJobRes;
      storagegroup.save(function (err, storagegroupSaved) {
        if (err) {
          logger.info('Storagegroup Fix: Failed to save Storagegroup object: ' + err);
          sgUpdateJob.update('Failed', 'Fix - Failed' , storagegroup);
          var errMsg = {};
          _.forOwn(err.errors, function(error, field) {
            logger.info(field, error.message);
            errMsg[field] = error.message;
          });
          return respondError(res, 400, errMsg);
        } else {
          logger.info('Storagegroup Fix: Fixed Successfully');
          sgUpdateJob.update('Completed', 'Fix - Applied' , storagegroup);
          res.json(storagegroupSaved);
        }
      });
    });
    return;
  }

  if (storagegroup.status !== 'Operational') {
    return respondError(res, 400, 'Storage Group is currently undergoing a different operation. Please wait until Status = Operational');
  }

  storagegroup.name = _.isUndefined(req.body.name) ? storagegroup.name : req.body.name;
  if(!_.isUndefined(req.body.annotation) && storagegroup.annotation !== req.body.annotation){
    storagegroup.annotation = req.body.annotation;
    wfaUpdateRequired = true;
  }
  if(!_.isUndefined(req.body.tier) && storagegroup.tier !== req.body.tier){
    storagegroup.tier = req.body.tier;
    wfaUpdateRequired = true;
  }
  if(!_.isUndefined(req.body.snapshotPolicy) && storagegroup.snapshotPolicy !== req.body.snapshotPolicy){
    storagegroup.snapshotPolicy = req.body.snapshotPolicy;
    wfaUpdateRequired = true;
  }
  storagegroup.status = wfaUpdateRequired ? 'Updating' : 'Operational';

  storagegroup.validate(function (err) {
    if (err) {
      var errMsg = {};
      _.forOwn(err.errors, function (error, field) {
        logger.info(field, error.message);
        errMsg[field] = error.message;
      });
      return respondError(res, 400, errMsg);
    } else {
      Job.create(req, 'storagegroup', function(err, updateJobRes) {
        sgUpdateJob = updateJobRes;
        storagegroup.save(function (err) {
          if (err) {
            sgUpdateJob.update('Failed', "Failed to Save : " + err, storagegroup);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            storagegroup.populate('tenant','name code')
            .populate('user', 'username')
            .populate('partner', 'name code')
            .populate('server', 'name code')
            .populate('subscription', 'name code')
            .populate('subtenant', 'name code', function (err, storagegroupPopulated) {
              if (err) {
                sgUpdateJob.update('Failed', "Failed to Populate : " + err, storagegroup);
                return respondError(res, 400, errorHandler.getErrorMessage(err));
              } else {
                storagegroup = storagegroupPopulated;
                res.json(storagegroup);
                if(wfaUpdateRequired){
                  updateSg();
                }else{
                  sgUpdateJob.update('Completed', 'Storage Group Updated', storagegroup);
                }
              }
            });
          }
        });
      });
    }
  });

  function updateSg() {
    var jobId;
    var args = {
      server: storagegroup.server.code,
      code: storagegroup.code,
      annotation: storagegroup.annotation,
      tier: storagegroup.tier,
      snapshotPolicy: storagegroup.snapshotPolicy
    };

    logger.info('StrGroup Update: Args for WFA' + util.inspect(args, {showHidden: false, depth: null}));
    clientWfa.sgUpdateExec(args, function (err, resWfa) {
      if (err) {
        sgUpdateJob.update('Failed', "Error on WFA : " + err, storagegroup);
        handleErrorFromWFA(storagegroup);
      } else {
        jobId = resWfa.jobId;
        logger.info('StrGroup Update: Response for WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilUpdated(jobId);
      }
    });
  }

  function untilUpdated(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.sgUpdateStatus(args, function (err, resWfa) {
      if (err) {
        logger.info('StrGroup Update: Failed to obtain status, Job ID: ' + jobId);
        sgUpdateJob.update('Failed', "Failed to Obtain Status : " + err, storagegroup);
        handleErrorFromWFA(storagegroup);
      } else {
        if (resWfa.jobStatus === 'FAILED') {
          logger.info('StrGroup Update: Failed to update, Job ID: ' + jobId);
          sgUpdateJob.update('Failed', "Failed to Update WFA : " + err, storagegroup);
          handleErrorFromWFA(storagegroup);
        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('StrGroup Update: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilUpdated(jobId); }, config.wfa.refreshRate);
        } else {
          storagegroup.status = 'Operational';
          sgUpdateJob.update('Completed', 'Storage Group is Operational', storagegroup);
          saveStoragegroup(storagegroup, 'StrGroup Update');
        }
      }
    });
  }

};

/**
 * Delete a storagegroup
 */
exports.delete = function (req, res) {
  var clientWfa = require('./storagegroups.server.wfa.sg.delete');
  var sgDeleteJob;
  var storagegroup = req.storagegroup;

  if (storagegroup.status !== 'Operational') {
    return respondError(res, 400, 'Storage Group is currently undergoing a different operation. Please wait until Status = Operational');
  }

  storagegroup.status = 'Deleting';

  //check for dependent Storage Units
  Storageunit.find({ 'storagegroup': mongoose.Types.ObjectId(storagegroup._id) }).exec(function (err, storageunits) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      if (storageunits.length > 0) {
        return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated Storage Units are deleted');
      } else {
        Job.create(req, 'storagegroup', function(err, deleteJobRes) {
          sgDeleteJob = deleteJobRes;
          storagegroup.save(function(err){
            if (err) {
              sgDeleteJob.update('Failed', "Failed to Save : " + err, storagegroup);
              return respondError(res, 400, errorHandler.getErrorMessage(err));
            } else {
              logger.info('StrGroup Delete: Delete Status Updated Successfully: ' + util.inspect(storagegroup, {showHidden: false, depth: null}));
              res.status(200).send();
              deleteSg();
            }
          });
        });
      }
    }
  });

  function deleteSg() {
    var jobId;
    var args = {
      server: storagegroup.server.code,
      code: storagegroup.code
    };

    logger.info('StrGroup Delete: Args for WFA' + util.inspect(args, {showHidden: false, depth: null}));
    clientWfa.sgDeleteExec(args, function (err, resWfa) {
      if (err) {
        logger.info('StrGroup Delete: Failed to delete Storage Group - Error : '+ err);
        sgDeleteJob.update('Failed', 'Error on WFA : ' + err, storagegroup);
        handleErrorFromWFA(storagegroup);
      } else {
        jobId = resWfa.jobId;
        logger.info('StrGroup Delete: Response from WFA' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilDeleted(jobId);
      }
    });
  }

  function untilDeleted(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.sgDeleteStatus(args, function (err, resWfa) {
      if (err) {
        logger.info('StrGroup Delete: Failed to obtain status, Job ID: ' + jobId);
        sgDeleteJob.update('Failed', 'Failed to Obtain Status : ' + err, storagegroup);
        handleErrorFromWFA(storagegroup);
      } else {
        if (resWfa.jobStatus === 'FAILED') {
          logger.info('StrGroup Delete: Failed to delete in WFA, Job ID: ' + jobId);
          sgDeleteJob.update('Failed', 'Recieved Failed status' , storagegroup);
          handleErrorFromWFA(storagegroup);
        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('StrGroup Delete: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilDeleted(jobId); }, config.wfa.refreshRate);
        } else {
          storagegroup.status = 'Deleted';
          deleteStoragegroup();
        }
      }
    });
  }

  function deleteStoragegroup() {
    storagegroup.remove(function (err) {
      if (err) {
        logger.info('StrGroup Delete: Failed to delete object in Mongo: ' + err);
      }else{
        sgDeleteJob.update('Completed', 'Storage Group Deleted' , storagegroup);
      }
    });
  }
};

/**
 * List of Storagegroups
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var query =  Storagegroup.find().populate('tenant','name code')
   .populate('subtenant','name code')
   .populate('partner','name code')
   .populate('subscription', 'name code')
   .populate('server','name code');

  if (req.query.server) {
    if(mongoose.Types.ObjectId.isValid(req.query.server)) {
      query.where({'server' : req.query.server});
    } else {
      return respondError(res, 400, 'Invalid server Id');
    }
  }

  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
  } else if (_.includes(req.user.roles, 'partner')) {
    query.where({ $or:[ {'tenant':req.user.tenant }, {'partner':req.user.tenant } ] });
  } else {
    query.where({ 'tenant': req.user.tenant });
  }

  query.exec(function (err, storagegroups) {
    respondList(err, storagegroups);
  });

  function respondList(err, storagegroups) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      res.json(storagegroups);
    }
  }
};

/**
 * Storage Group middleware
 */
exports.storagegroupByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return respondError(res, 400, 'Storage Group is invalid');
  }

  Storagegroup.findById(id)
  .populate('tenant','name code')
  .populate('partner','name code')
  .populate('subtenant','name code')
  .populate('subscription', 'name code')
  .populate('server','name code')
  .populate('user','username').exec(function (err, storagegroup) {
    if (err) {
      return next(err);
    } else if (!storagegroup) {
      return respondError(res, 404, 'No Storage Group with that identifier has been found');
    }
    req.storagegroup = storagegroup;
    next();
  });
};
