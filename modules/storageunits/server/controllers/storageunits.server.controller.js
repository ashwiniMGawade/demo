'use strict';

/**
 * Storage unit Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  ip = require('ip'),
  util = require('util'),
  mongoose = require('mongoose'),
  rabbitMqService = require(path.resolve('./config/lib/rabitmqService')),
  featuresSettings = require(path.resolve('./config/features')),
  Storageunit = mongoose.model('Storageunit'),
  Subscription = mongoose.model('Subscription'),
  Job = mongoose.model('Job'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var saveStorageUnit = function(storageunit, from, callback) {
  callback = callback || function(){};
  storageunit.save(function (err, storageunitSaved) {
    if (err) {
      logger.info(from + ': Failed to save Storage Unit object: ' + err);
    } else {
      storageunit = storageunitSaved;
      logger.info(from + ': Storage Unit Saved Successfully');
      callback();
    }
  });
};

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
    res.status(errCode).send({
     message: errMessage
    });
};

var handleErrorFromWFA = function(storageunit) {
  logger.info("Error on WFA, moving status to Contact Support");
  storageunit.status = 'Contact Support';
  saveStorageUnit(storageunit, "Error on WFA");
};


/**
* Create Storage Unit
*/
exports.create = function (req, res) {
  var clientWfa = require('./storageunits.server.wfa.su.create');
  var suCreateJob;

	var storageunit = new Storageunit();
  storageunit.user = req.user;
  storageunit.name = req.body.name || '';
  storageunit.code = req.body.code || '';
  storageunit.sizegb = req.body.sizegb;
  storageunit.protocol = req.body.protocol || '';
  storageunit.application = req.body.application || '';
  storageunit.aggr = req.body.aggr || '';

  if (storageunit.protocol === 'iscsi' || storageunit.protocol === 'fc' )  {
    storageunit.lunOs = req.body.lunOs  || '';
    storageunit.lunId = req.body.lunId || '';
    storageunit.acl = req.body.acl || '';
    storageunit.igroup = req.body.igroup || '';
    storageunit.mapping = req.body.mapping || '';
  }
 
  if (storageunit.protocol === 'nfs') {
    storageunit.readWriteClients = req.body.readWriteClients || '';
    storageunit.readOnlyClients = req.body.readOnlyClients || '';
  }

  if (req.body.clusterId) {
    if (mongoose.Types.ObjectId.isValid(req.body.clusterId)) {
      storageunit.cluster = mongoose.Types.ObjectId(req.body.clusterId);
    } else {
      storageunit.cluster = mongoose.Types.ObjectId();
    }
  }

  if (req.body.serverId) {
    if (mongoose.Types.ObjectId.isValid(req.body.serverId)) {
      storageunit.server = mongoose.Types.ObjectId(req.body.serverId);
    } else {
      storageunit.server = mongoose.Types.ObjectId();
    }
  }

  storageunit.validate(function(err) {
    if (err) {
      var errMsg = {};
      _.forOwn(err.errors, function (error, field) {
        logger.info(field, error.message);
        errMsg[field] = error.message;
      });
      return respondError(res, 400, errMsg);
    } else {
      Job.create(req, 'storageunits', function(err, createJobRes) {
        suCreateJob = createJobRes;
        storageunit.save(function (err) {
          if (err) {
            suCreateJob.update('Failed', err, storageunit);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            storageunit.populate('server', 'name code')
              .populate('cluster', 'name uuid management_ip', function (err, storageunitPopulated) {
              if (err) {
                suCreateJob.update('Failed', err, storageunit);
                return respondError(res, 400, errorHandler.getErrorMessage(err));
              } else {
                storageunit = storageunitPopulated;
                res.json(storageunit);                
                createSu();
              }
            });
          }
        });
      });
    }
  });

  function createSu() {
    var jobId;
    var args = {
      name: storageunit.code,
      protocol: storageunit.protocol,
      size: storageunit.sizegb,
      application: storageunit.application,
      vserverName : storageunit.server.name, 
      aggrName : storageunit.aggr, 
      clusterName: storageunit.cluster.management_ip, 
      objectType: "storageunits",
      action: "create",
      objectId: storageunit._id,
      jobId:suCreateJob._id
    };

    if (storageunit.protocol === "cifs") {
      args.user_or_group = "";
      args.permission = "";
    }

    if (storageunit.protocol === "nfs") {
      args.acl = {
        roRule : storageunit.readOnlyClients,
        rwRule : storageunit.readWriteClients
      }
    }

    if (storageunit.protocol === "iscsi" || storageunit.protocol === "fc") {
      args.existingServer = storageunit.mapping == "existing" ? true : false;
      args.igroupName = storageunit.igroup;
      args.initiators = storageunit.mapping == "new" ? storageunit.acl : "";
      args.osType  = storageunit.lunOs || '';
      args.lunId = storageunit.lunId || '';
    }

    logger.info('Storage unit create Args:' + util.inspect(args, {showHidden: false, depth: null}));

    rabbitMqService.publisheToQueue(args);

    // clientWfa.suCreateExec(args, function(err, resWfa) {
    //   if (err) {
    //     suCreateJob.update('Failed', 'Storage unit create: Failed to create WFA, Error:' + err, storageunit);
    //     logger.info('Storage unit create: Failed to create, Error:' + err);
    //     handleErrorFromWFA(storageunit);
    //   } else {
    //     jobId = resWfa.jobId;
    //     logger.info('Storage Unit: Response from WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    //     untilCreated(jobId);
    //   }
    // });
  }

  function untilCreated(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.suCreateStatus(args, function (err, resWfa) {
      if (err) {
        suCreateJob.update('Failed', 'Storage unit create: Failed to obtain status WFA:' + err, storageunit);
        logger.info('Storage unit Create: Failed to obtain status, Error: ' + err);
        handleErrorFromWFA(storageunit);

      } else {
        if (resWfa.jobStatus === 'FAILED') {
          suCreateJob.update('Failed', 'Storage unit create: Failed to create WFA:' + err, storageunit);
          logger.info('Storage unit Create: Failed to create, Job ID: ' + jobId);
          handleErrorFromWFA(storageunit);

        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('Storage unit Create: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilCreated(jobId); }, config.wfa.refreshRate);

        } else {
          suCreateJob.update('Completed', null, storageunit);
          logger.info("Storage unit created with completed status");
          storageunit.status = 'Operational';
          saveStorageUnit(storageunit, 'Storage Unit Create');
        }
      }
    });
  }
};


/**
* Show the current Storage Unit
*/
exports.read = function (req, res) {
  var storageunit = req.storageunit.toObject();
  storageunit.storageunitId = storageunit._id;
  res.json(storageunit);
  // var dbWfa = require('./storageunits.server.wfa.db.read');
  // mongoose.model('Storagegroup').findById(storageunit.storagegroup).exec(function (err, storagegroup) {
  //   mongoose.model('Server').findById(storagegroup.server).exec(function (err, server) {
  //     if(storageunit.protocol === 'cifs'){
  //       storageunit.mount = '\\\\'+server.cifsServername+'.'+server.cifsDnsDomain+'\\'+storageunit.code+'$';
  //       storageunit.mount1 = '\\\\'+server.ipMgmt+'\\'+storageunit.code+'$';
  //       res.json(storageunit);
  //     }else if(storageunit.protocol === 'nfs'){
  //       storageunit.mount = server.ipMgmt+':/'+storagegroup.code+'/'+storageunit.code;
  //       res.json(storageunit);
  //     }else if(storageunit.protocol === 'iscsi'){
  //       var args = {
  //         code: storageunit.code,
  //         server: server.code || '',
  //         storagegroup: storagegroup.code
  //       };
  //       dbWfa.sgRead(args, function (err, out) {
  //         if (err) {
  //           logger.info('SG Create: Failed to Read LUN ID for ISCSI from  WFA, Error: ' + err);
  //           res.json(storageunit);
  //         } else {
  //           storageunit.mount = server.ipsSan+':'+out.lunid;
  //           res.json(storageunit);
  //         }
  //       });
  //     }
  //   });
  // });
};

/**
 * Update a Storage Unit
 */
exports.update = function (req, res) {
  var wfaUpdateRequired = false;
  var clientWfa = require('./storageunits.server.wfa.su.update');
  var storageunit = req.storageunit;
  var suUpdateJob;
  var sizegbDifference = 0;

   //If the request is from fix page and its root, he can modify the following parameters
  if(req.body.fromFix && _.includes(req.user.roles, 'root')){

    logger.info('SU Fix: Storageunit Object: ' + util.inspect(storageunit, {showHidden: false, depth: null}));
    logger.info('SU Fix: Request Body: ' + util.inspect(req.body, {showHidden: false, depth: null}));

    storageunit.status = _.isUndefined(req.body.status) ? storageunit.status : req.body.status ;

    Job.create(req, 'storageunit', function(err, updateJobRes) {
    suUpdateJob = updateJobRes;
      storageunit.save(function (err, storageunitSaved) {
        if (err) {
          logger.info('Storageunit Fix: Failed to save Storageunit object: ' + err);
          suUpdateJob.update('Failed', 'Fix - Failed' , storageunit);
          var errMsg = {};
          _.forOwn(err.errors, function(error, field) {
            logger.info(field, error.message);
            errMsg[field] = error.message;
          });
          return respondError(res, 400, errMsg);
        } else {
          logger.info('Storageunit Fix: Fixed Successfully');
          suUpdateJob.update('Completed', 'Fix - Applied' , storageunit);
          res.json(storageunitSaved);
        }
      });
    });
    return;
  }

  if (storageunit.status !== 'Operational') {
    return respondError(res, 400, 'Storage Unit is currently undergoing a different operation. Please wait until Status is Operational');
  }

  storageunit.name = _.isUndefined(req.body.name) ? storageunit.name : req.body.name;

  if (!_.isUndefined(req.body.sizegb) && storageunit.sizegb !== req.body.sizegb) {
    if (storageunit.protocol === 'iscsi' && req.body.sizegb < storageunit.sizegb) {
      return respondError(res, 400, 'Size must be higher than the existing Size');
    }

    sizegbDifference = req.body.sizegb - storageunit.sizegb;
    storageunit.sizegb = req.body.sizegb;
    wfaUpdateRequired = true;
  }

  //update acl as per the update and remove
  if (storageunit.protocol === 'nfs' || storageunit.protocol === 'iscsi') {
    var acl_array = storageunit.acl ? storageunit.acl.split(',') : [];

    //validate aclAdd against the pattern
    if (req.body.aclAdd && storageunit.protocol === 'nfs' && !(/^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)((\/([8-9]|1[0-9]|2[0-6]))*)$/).test(req.body.aclAdd)) {
      return respondError(res, 400, 'Invalid ACL to add');
    } else if(req.body.aclAdd && storageunit.protocol === 'iscsi' && !(/^((?:iqn\.[0-9]{4}-[0-9]{2}(?:\.[A-Za-z](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)+(?::[^,:]*)?)|(eui\.[0-9A-Fa-f]{16}))$/).test(req.body.aclAdd)) {
      return respondError(res, 400, 'Invalid ACL to add');
    } else if (req.body.aclAdd) {
      acl_array.push(req.body.aclAdd);
      wfaUpdateRequired = true;
    }

    //validate aclRemove , to have in the existing list
    if (req.body.aclRemove && !_.includes(acl_array, req.body.aclRemove)) {
      return respondError(res, 400, 'ACL to be removed should be an exisitng ACL for the storageunit');
    } else if(req.body.aclRemove && _.includes(acl_array, req.body.aclRemove)) {
       acl_array.splice(acl_array.indexOf(req.body.aclRemove), 1);
       wfaUpdateRequired = true;
    }
    storageunit.acl = acl_array.join();
  }

  storageunit.validate(function(err) {
    if (err) {
      var errMsg = '';
      _.forOwn(err.errors, function(error, field) {
        errMsg = errMsg  + error.message +". ";
      });

      return respondError(res, 400, errMsg);
    } else {
      storageunit.status = wfaUpdateRequired ? 'Updating' : 'Operational';
      Job.create(req, 'storageunit', function(err, createJobRes) {
        suUpdateJob = createJobRes;
        storageunit.save(function (err, storageunitSaved) {
          if (err) {
            suUpdateJob.update('Failed', err, storageunit);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            storageunit
            .populate('partner', 'name code')
            .populate('server', 'name code')
            .populate('tenant', 'name code')
            .populate('subtenant', 'name code')
            .populate('subscription', 'name code')
            .populate('storagegroup', 'name code', function (err, storageunitPopulated) {
              if (err) {
                suUpdateJob.update('Failed', err, storageunit);
                return respondError(res, 400, errorHandler.getErrorMessage(err));
              }
              else {
                storageunit = storageunitPopulated;
                res.json(storageunit);
                if (wfaUpdateRequired) {
                  suUpdateJob.update('Processing', 'Storage Unit Updating', storageunit);

                  if (sizegbDifference !== 0 && featuresSettings.paymentMethod.prePaid) {
                    updateSubscription();
                  } else {
                    updateSu();
                  }
                } else {
                  suUpdateJob.update('Completed', null, storageunit);
                }
              }
            });
          }
        });
      });
    }
  });

  function updateSubscription() {
    Subscription.findById(storageunit.subscription, function (err, subscription) {
      if (err) {
        return respondError(res, 400, errorHandler.getErrorMessage(err));
      } else if (!subscription) {
        return respondError(res, 400, 'No Subscription associated with that Storage Group\'s Server has been found');
      } else {
        storageunit.populate('storagegroup', 'name code tier', function (err, storageunitPopulated) {
          if (err) {
            suUpdateJob.update('Failed', err, storageunit);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            _.forEach(subscription.storagePack, function (value, key) {
              if (value.class === 'ontap-' + storageunitPopulated.storagegroup.tier) {
                var classElements = _.filter(subscription.storagePack, {'class': value.class});
                if (classElements && classElements.length > 1) {
                  suUpdateJob.update('Failed', 'duplicate subscription storage classes', storageunitPopulated);
                  return respondError(res, 400, errorHandler.getErrorMessage(err));
                } else {
                  subscription.storagePack[key].sizegb.available = subscription.storagePack[key].sizegb.available - sizegbDifference;
                  subscription.save(function (err) {
                    if (err) {
                      suUpdateJob.update('Failed', err, storageunit);
                      return respondError(res, 400, errorHandler.getErrorMessage(err));
                    } else {
                      updateSu();
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  }

  function updateSu() {
    var args = {
      server: storageunit.server.code,
      storagegroup:storageunit.storagegroup.code,
      storageunit:storageunit.code,
      size_mb: 1024 * storageunit.sizegb,
      acl_add: req.body.aclAdd || '',
      acl_remove:req.body.aclRemove || ''
    };
    var jobId;
    logger.info('Storage Unit Update: Args for WFA' + util.inspect(args, {showHidden: false, depth: null}));
    clientWfa.suUpdateExec(args, function (err, resWfa) {
      if (err) {
        suUpdateJob.update('Failed', 'Failed to update WFA ' + err , storageunit);
        logger.info('Storage Unit Update: Failed to update - Error: ' + err);
        handleErrorFromWFA(storageunit);

      } else {

        jobId = resWfa.jobId;
        logger.info('Storage Unit Update: Response for WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilUpdated(jobId);
      }
    });
  }

  function untilUpdated(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.suUpdateStatus(args, function (err, resWfa) {
      if (err) {
        suUpdateJob.update('Failed', 'Failed to obtain status WFA ' + err , storageunit);
        logger.info('Storage Unit Update: Failed to obtain status - Error : '+ err);
        handleErrorFromWFA(storageunit);

      } else {
        if (resWfa.jobStatus === 'FAILED') {
          suUpdateJob.update('Failed', 'Failed to update WFA ' + err , storageunit);
          logger.info('Storage Unit Update: Failed to update Storage Unit, Job ID: ' + jobId);
          handleErrorFromWFA(storageunit);

        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('Storage Unit Update: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilUpdated(jobId); }, config.wfa.refreshRate);

        } else {
          storageunit.status = 'Operational';
          suUpdateJob.update('Completed', null , storageunit);
          saveStorageUnit(storageunit, 'Storage Unit Update');
        }
      }
    });
  }
};


/**
 * Delete a Storage Unit
 */
exports.delete = function (req, res) {
  var clientWfa = require('./storageunits.server.wfa.su.delete.js');
  var storageunit = req.storageunit;
  var suDeleteJob;

  if (storageunit.status !== 'Operational') {
    return respondError(res, 400, 'Storage unit is currently undergoing a different operation. Please wait until Status = Operational');
  }

  storageunit.status = 'Deleting';
  Job.create(req, 'storageunit', function(err, createJobRes) {
    suDeleteJob = createJobRes;
    storageunit.save(function(err){
      if (err) {
        suDeleteJob.update('Failed', err, storageunit);
        return respondError(res, 400, errorHandler.getErrorMessage(err));
      } else {
        logger.info('Storage Unit Delete: Delete Status Updated Successfully: ' + util.inspect(storageunit, {showHidden: false, depth: null}));
        res.status(200).send();

        if (featuresSettings.paymentMethod.prePaid) {
          updateSubscription();
        } else {
          deleteSu();
        }
      }
    });
  });

  function updateSubscription() {
    Subscription.findById(storageunit.subscription, function (err, subscription) {
      if (err) {
        return respondError(res, 400, errorHandler.getErrorMessage(err));
      } else if (!subscription) {
        return respondError(res, 400, 'No Subscription associated with that Storage Group\'s Server has been found');
      } else {
        storageunit.populate('storagegroup', 'name code tier', function (err, storageunitPopulated) {
          if (err) {
            suDeleteJob.update('Failed', err, storageunit);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            _.forEach(subscription.storagePack, function (value, key) {
              if (value.class === 'ontap-' + storageunitPopulated.storagegroup.tier) {
                var classElements = _.filter(subscription.storagePack, {'class': value.class});
                if (classElements && classElements.length > 1) {
                  suDeleteJob.update('Failed', 'duplicate subscription storage classes', storageunitPopulated);
                  return respondError(res, 400, errorHandler.getErrorMessage(err));
                } else {
                  subscription.storagePack[key].sizegb.available = subscription.storagePack[key].sizegb.available + storageunit.sizegb;
                  subscription.save(function (err) {
                    if (err) {
                      suDeleteJob.update('Failed', err, storageunit);
                      return respondError(res, 400, errorHandler.getErrorMessage(err));
                    } else {
                      deleteSu();
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  }

  function deleteSu() {
    var args = {
      server : storageunit.server.code,
      storagegroup: storageunit.storagegroup.code,
      storageunit: storageunit.code
    };
    var jobId;
    logger.info('storage unit delete: Args for WFA' + util.inspect(args, {showHidden: false, depth: null}));
    clientWfa.suDeleteExec(args, function (err, resWfa) {
      if (err) {
        suDeleteJob.update('Failed', 'Failed to delete Storage Unit WFA' + err, storageunit);
        logger.info('Storage Unit Delete: Failed to delete Storage Unit - Error : '+ err);
        handleErrorFromWFA(storageunit);
      } else {
        jobId = resWfa.jobId;
        logger.info('Storage Unit Delete: Response from WFA' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilDeleted(jobId);
      }
    });
  }

  function untilDeleted(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.suDeleteStatus(args, function (err, resWfa) {
      if (err) {
        suDeleteJob.update('Failed', 'Failed to obtain status WFA' + err, storageunit);
        logger.info('Storage Unit Delete: Failed to obtain status, Job ID: ' + jobId);
        handleErrorFromWFA(storageunit);

      } else {

        if (resWfa.jobStatus === 'FAILED') {
          suDeleteJob.update('Failed', 'Failed to delete storageunit WFA' + err, storageunit);
          logger.info('Storage Unit Delete: Failed to delete Storage Unit, Job ID: ' + jobId);
          handleErrorFromWFA(storageunit);

        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('Storage Unit Delete: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilDeleted(jobId); }, config.wfa.refreshRate);

        } else {
          storageunit.status = 'Deleting';
          suDeleteJob.update('Completed', null, storageunit);
          saveStorageUnit(storageunit, 'Storage Unit Delete');
          deleteStorageUnit();
        }
      }
    });
  }

  function deleteStorageUnit() {
    storageunit.remove(function (err) {
      if (err) {
        logger.info('Storage Unit Delete: Failed to delete object: ' + err);
      }
    });
  }
};



/**
 * List of Storage Units
 */
exports.list = function (req, res) {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var query = Storageunit.find({})
    .populate('server', 'name code')
    .populate('cluster', 'name management_ip')

  if (req.query.server) {
    if (mongoose.Types.ObjectId.isValid(req.query.server)) {
      query.where({'server' : req.query.server});
    } else {
      return respondError(res, 400, 'Invalid server Id');
    }
  }

  if (req.query.cluster) {
    if (mongoose.Types.ObjectId.isValid(req.query.cluster)) {
      query.where({'cluster' : req.query.cluster});
    } else {
      return respondError(res, 400, 'Invalid cluster Id');
    }
  }

  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
  } else if (_.includes(req.user.roles, 'partner')) {
    query.where({ $or:[ {'tenant':req.user.tenant }, {'partner':req.user.tenant} ] });
  } else {
    query.where({ 'tenant': req.user.tenant });
  }

  query.exec(function (err, storageunits) {
    respondList(err, storageunits);
  });

  function respondList(err, storageunits) {
    if (err) {
     return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      res.json(storageunits);
    }
  }
};


/**
 * Storage unit middleware
 */
exports.storageunitByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return respondError(res, 400, 'Storage unit is invalid');
  }

  Storageunit.findById(id).populate('storagegroup','name code')
  .populate('cluster','name management_ip')
  .populate('server','name code')
  .exec(function (err, storageunit) {
    if (err) {
      return next(err);
    } else if (!storageunit) {
      return respondError(res, 400, 'No storageunit with that identifier has been found');
    }
    req.storageunit = storageunit;
    next();
  });
};

/**
 * Get list of available igroups under given server and cluster
 */
exports.getListOfIgroups = function(req, res) {
  console.log("called");
};
