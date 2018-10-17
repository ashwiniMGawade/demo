'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  ip = require('ip'),
  mongoose = require('mongoose'),
  Server = mongoose.model('Server'),
  Icr = mongoose.model('Icr'),
  Pod = mongoose.model('Pod'),
  Site = mongoose.model('Site'),
  Subscription = mongoose.model('Subscription'),
  Job = mongoose.model('Job'),
  config = require(path.resolve('./config/config')),
  featuresSettings = require(path.resolve('./config/features')),
  Storagegroup = mongoose.model('Storagegroup'),
  Storageunit = mongoose.model('Storageunit'),
  sanitizeMessage = require(path.resolve('./config/lib/SanitizeMessage')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var saveServer = function(server, from, callback) {
  callback = callback || function(){};
  server.save(function (err, serverSaved) {
    if (err) {
      logger.info(from + ': Failed to save Server object: ' + err);
    } else {
      server = serverSaved;
      logger.info(from + ': Server Saved Successfully');
      callback();
    }
  });
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

var sendServerResponse = function(res, server) {
  var resServer = typeof server.toObject === 'function' ? server.toObject() : server;
  if (!featuresSettings.server.gateway.enabled) {
    delete resServer['gateway'];
    logger.info(resServer.gateway);
    logger.info(util.inspect(server, {showHidden: false, depth: null}));
    res.json(resServer);
  } else {
    res.json(resServer);
  }
};

/**
 * Create a server
 */
exports.create = function (req, res) {
  var serverCreateJob;
  var dbWfa = require('./servers.server.wfa.db.read');
  var clientWfa = require('./servers.server.wfa.svm.create');
  var server = new Server();

  server.user = req.user;
  server.name = req.body.name;
  server.vlan = req.body.vlan;
  server.subnet = req.body.subnet;
  server.managed = req.body.managed;

  if (featuresSettings.server.gateway.enabled) {
    server.gateway = req.body.gateway;
  }  

  if(req.body.siteId){
    if(mongoose.Types.ObjectId.isValid(req.body.siteId)){
      server.site =  mongoose.Types.ObjectId(req.body.siteId);
    }else{
      server.site = mongoose.Types.ObjectId();
    }
  }
  if(req.body.subtenantId){
    if(mongoose.Types.ObjectId.isValid(req.body.subtenantId)){
      server.subtenant =  mongoose.Types.ObjectId(req.body.subtenantId);
    }else{
      server.subtenant = mongoose.Types.ObjectId();
    }
  }

  if(req.body.subscriptionId){
    if(mongoose.Types.ObjectId.isValid(req.body.subscriptionId)){
      server.subscription =  mongoose.Types.ObjectId(req.body.subscriptionId);
    }else{
      server.subscription = mongoose.Types.ObjectId();
    }
  }

  var password = req.body.password || '';
  var cidrSubnet;
  var site;
  var pod;

  // The callback hell below is terrible and should be refactored at some
  // stage :( JL - 16 Mar 2018

  // Get site
  logger.info('SVM Create: server.site: ' + util.inspect(server.site, {showHidden: false, depth: null}));
  Site.findById(server.site).populate('site','name code').exec(function (err, site) {
    if(err) {
      return res.status(404).send({ message: 'Failed to retrive site' });
    } else if (!site) {
      return res.status(404).send({ message: 'No site with that identifier has been found' });
    }
    logger.info('SVM Create: Site.findById(): site: ' + util.inspect(site, {showHidden: false, depth: null}));

    // Get subscription
    logger.info('SVM Create: server.subscription: ' + util.inspect(server.subscription, {showHidden: false, depth: null}));
    Subscription.findById(server.subscription).populate('subscription','name code').exec(function (err, subscription) {
      if(err) {
        return res.status(404).send({ message: 'Failed to retrive subscription' });
      } else if (!subscription) {
        return res.status(404).send({ message: 'No subscription with that identifier has been found' });
      }
      logger.info('SVM Create: Subscription.findById(): subscription: ' + util.inspect(subscription, {showHidden: false, depth: null}));

      // Get Pod Code and Cluster
      dbWfa.getAdminVserver(site.code, subscription.code, function (err, adminVserver) {
        if(err) {
          logger.error('SVM Create: Failed to retrieve Pod Code and Cluster Name from WFA. Error: ' + err); 
          return respondError(res, 400, 'Failed to retrieve Pod Code and Cluster Name from WFA. Error: ' + err);
        } else {
          // Get Pod
          Pod.findByCode(adminVserver.podCode, function (err, podResults) {
            if (podResults.length === 0) {
              logger.error('SVM Create: Failed to retrieve Pod from Mongo - Pod Code: \"' + adminVserver.podCode + '\".');
              return respondError(res, 400, 'Failed to retrieve Pod from Mongo - Pod Code: \"' + adminVserver.podCode + '\".');
            } else {
              // FIXME Pod is always (incorrectly) assumed to be the first and only pod within a site.
              // Multiple pods can exist for a site, but this code only considers the first one
              // returned. JL - 9 Mar 2018
              pod = podResults[0];
    
              //Perform all model level validation and return error
              server.validate(function(err){
                if(err){
                  var errMsg = {};
                  _.forOwn(err.errors, function(error, field) {
                    logger.info(field, error.message);
                    errMsg[field] = error.message;
                  });
                  return respondError(res, 400, errMsg);
                } else {
            
                  // Validate VLAN.
                  if(server.vlan) {
            
                    // VLAN was specified by user.
                    if(!server.vlan.match(/^(?:[1-9]\d{0,2}|[1-3]\d{3}|40(?:[0-8]\d|9[0-3]))$/)) {
                      return respondError(res, 400, 'Invalid VLAN \"' + server.vlan + '\" specified. A VLAN is an integer value in the range 1-4093.');
                    }
            
                    // Verify that the user supplied VLAN is within the 
                    // vlansAvailable range for the appropriate pod. If the supplied VLAN is
                    // outside available range, a respondError() should be called. JL - 9 Mar 2018
                    logger.info('SVM Create: server.vlan specified by user. VLAN: ' + server.vlan);
            
                    // Check to see if supplied VLAN is within vlansAvailable range.
                    logger.info('SVM Create: pod.vlansAvailable: ' + util.inspect(pod.vlansAvailable, {showHidden: false, depth: null}));
                    logger.info('SVM Create: _.toInteger(server.vlan): ' + util.inspect(_.toInteger(server.vlan), {showHidden: false, depth: null}));
            
                    if(_.indexOf(pod.vlansAvailable, _.toInteger(server.vlan)) === -1) {
                      logger.error('SVM Create: VLAN \"' + server.vlan + '\" specified by user is not within vlansAvailable defined in pod \"' + adminVserver.podCode + '\".');
                      return respondError(res, 400, 'VLAN \"' + server.vlan + '\" specified is not in the available VLAN list defined in pod \"' + adminVserver.podCode + '\".');
                    } 
                  } else {
                    // Ensure that there are VLANs available in the pod to pop one off the list.
                    logger.info('SVM Create: pod.vlansAvailable.length: ' + pod.vlansAvailable.length);
                    if(pod.vlansAvailable.length === 0) {
                      logger.error('SVM Create: Zero VLANs available in pod \"' + adminVserver.podCode + '\". Admin will need to add more VLANs to this Pod (if there are any available).');
                      return respondError(res, 400, 'Zero VLANs available in pod \"' + adminVserver.podCode + '\".');
                    }
                  }
            
                  // Validate subnet.
                  cidrSubnet = ip.cidrSubnet(server.subnet);
                  //Masking and suggesting the subnet IP for user
                  if(server.subnet.split('/')[0]!==cidrSubnet.networkAddress){
                    return respondError(res, 400, "Valid IP for subnet after masking is "+cidrSubnet.networkAddress);
                  }
            
                  //Validating the gateway is in subnet
                  if(server.gateway){
                    if(!cidrSubnet.contains(server.gateway)){
                      return respondError(res, 400, "Gateway IP is not in the Subnet");
                    }else if(((ip.toLong(cidrSubnet.firstAddress) + 2) < ip.toLong(server.gateway)) &&
                             ((ip.toLong(cidrSubnet.firstAddress) + 31) > ip.toLong(server.gateway))){
                      return respondError(res, 400, "Gateway IP is already reserved for the Server");
                    }else if(cidrSubnet.broadcastAddress === server.gateway){
                      return respondError(res, 400, "Gateway IP cannot be the same as the Subnet Broadcast IP");
                    }else if(cidrSubnet.networkAddress === server.gateway){
                      return respondError(res, 400, "Gateway IP cannot be the same as the Subnet IP");
                    }
                  }else{
                    server.gateway = cidrSubnet.firstAddress;
                  }
            
                  //Validating password
                  if (server.managed === 'Customer') {
                    if(!password){
                      return respondError(res, 400, "Password is mandatory if Managed = Customer");
                    }else if(!password.match(/^(?=.*[0-9])(?=.*[a-zA-Z])\w{8,16}$/)){
                      return respondError(res, 400, "Password length must be 8-16 characters, contain no special characters, at least a digit and a letter");
                    }
                  }else if (req.body.managed === 'Portal') {
                    if (req.body.password) {
                      return respondError(res, 400, "Password must be blank if Managed = Portal");
                    }
                  }
            
                  // Assing ipsIcl field for customer managed vfaas
                  if (server.managed === 'Customer') {
                    var firstNasIp = ip.fromLong(ip.toLong(cidrSubnet.firstAddress) + 17);        
                    var lastNasIp = ip.fromLong(ip.toLong(cidrSubnet.firstAddress)  + 24);
                    var lastNasIpLastOctet = lastNasIp.split(".")[3];
                    server.ipsIcl = firstNasIp + '-' + lastNasIpLastOctet;
                  }
            
                  Job.create(req, 'server', function(err, createJobRes) {
                    serverCreateJob = createJobRes;
                    server.save(function (err) {
                      if (err) {
                        serverCreateJob.update('Failed', "Err on Save : " + err, server);
                        return respondError(res, 400, errorHandler.getErrorMessage(err));
                      } else {
                        server.populate('tenant','name code')
                              .populate('partner','name code')
                              .populate('subtenant','name code')
                              .populate('subscription','name code')
                              .populate('user', 'username displayName')
                              .populate('site','name code', function (err, serverPopulated) {
                          if (err){
                            logger.info('SVM Create: Populate Error: ' + err);
                            serverCreateJob.update('Failed', "Err on Populate : " + err, server);
                            return respondError(res, 400, errorHandler.getErrorMessage(err));
                          } else {
                            server = serverPopulated;                
                            logger.info('SVM Create: Server Populated: ' + util.inspect(server, {showHidden: false, depth: null}));
                            logger.info("called sendServerResponse");
                            sendServerResponse(res, server);
            
                            // Process VLAN, whether it was supplied by user or popped from the list
                            // of available VLANs within that pod.
                            if(!server.vlan) {
                              // VLAN wasn't specified by user. Use the next VLAN from the vlansAvailable array.
                              server.vlan = pod.vlansAvailable.$shift();
                              logger.info('SVM Create: server.vlan NOT specified by user. Using VLAN: ' + server.vlan);
                            } else {
                              // Remove user specifed VLAN from vlansAvailable array.
                              pod.vlansAvailable.pull(_.toInteger(server.vlan));
                              logger.info('SVM Create: pod.vlansAvailable after removing server.vlan: ' + util.inspect(pod.vlansAvailable, {showHidden: false, depth: null}));
                            }
            
                            // Add VLAN to vlansUsed array.
                            pod.vlansUsed.push(server.vlan);
                            logger.info('SVM Create: pod.vlansUsed after pushing server.vlan: ' + util.inspect(pod.vlansUsed, {showHidden: false, depth: null}));
                            pod.vlansUsed.sort(function(a,b) { return a-b });
                            logger.info('SVM Create: pod.vlansUsed after sorting: ' + util.inspect(pod.vlansUsed, {showHidden: false, depth: null}));
                
                            logger.info('SVM Create: pod before saving: ' + util.inspect(pod, {showHidden: false, depth: null}));
                            pod.save(function (err) {
                              if (err) {
                                logger.info('SVM Create: pod.save() failed: ' + err);
                              } else {
                                logger.info('SVM Create: pod.save() succeeded.');
                              }
                            });
                            server.pod = pod;
                
                            createSvm(adminVserver.clusterName);
                          }
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    });
  });


  function createSvm(clusterName) {
    var jobId;
    var args = {
      vlan: server.vlan,
      ipBase: ip.fromLong(ip.toLong(cidrSubnet.firstAddress) + 3),
      subnetMask: cidrSubnet.subnetMask,
      gateway: server.gateway,
      subtenantCode: server.subtenant.code,
      tenantCode: server.tenant.code,
      subscriptionCode: server.subscription.code,
      clusterName: clusterName,
      password: password
    };
    
    clientWfa.svmCreateExec(args, function (err, resWfa) {
      if (err) {
        logger.info('SVM Create: Failed to create SVM, Error: ' + err);
        server.status = 'Contact Support';
        serverCreateJob.update('Failed', 'Failed to create SVM, Error: ' + err, server);
        server.save(function (err) {
          if (err) {
            logger.info('SVM Create: Failed to Save, Error: ' + err);
          }
        });
      } else {
        jobId = resWfa.jobId;
        logger.info('SVM Create: Response from WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilCreated(jobId);
      }
    });
  }

  function untilCreated(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.svmCreateStatus(args, function (err, resWfa) {
      if (err) {
        logger.info('SVM Create: Failed to obtain status, Error: ' + err);
        server.status = 'Contact Support';
        serverCreateJob.update('Failed', 'Failed to Obtain Status, Error: ' + err, server);
        server.save(function (err) {
          if (err) {
            logger.info('SVM Create: Failed to Save, Error: ' + err);
          }
        });
      } else {
        if (resWfa.jobStatus === 'FAILED') {
          logger.info('SVM Create: Failed to create, Job ID: ' + jobId);
          server.status = 'Contact Support';
          serverCreateJob.update('Failed', 'Recieved Failed Status from WFA, Error: ' + err, server);
          server.save(function (err) {
            if (err) {
              logger.info('SVM Create: Failed to Save, Error: ' + err);
            }
          });
          getOutputs(jobId);
        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('SVM Create: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilCreated(jobId); }, config.wfa.refreshRate);
        } else {
          getOutputs(jobId);
        }
      }
    });
  }

  function getOutputs(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.svmCreateOut(args, function (err, resWfa) {
      if (err) {
        logger.info('SVM Create: Failed to obtain output, Error: ' + err);
        server.status = 'Contact Support';
        serverCreateJob.update('Failed', 'Failed to obtain output Parameters, Error: ' + err, server);
        server.save(function (err) {
          if (err) {
            logger.info('SVM Create: Failed to Save, Error: ' + err);
          }
        });
      } else {
        if (resWfa) {
          if (server.managed === 'Customer') {
            server.ipVirtClus = resWfa.ipVirtClus;
          }

          server.ipMgmt = resWfa.ipMgmt;
          server.code = resWfa.code;
          server.status = 'Operational';
          server.save(function (err) {
            if (err) {
              logger.info('SVM Create: Failed to Save, Error: ' + err);
            }else{
              server.populate('tenant','name code', function (err, serverPopulated) {
                serverCreateJob.update('Completed', 'Server moved to Operational', server);
              });
            }
          });
        } else {
          logger.info('SVM Create: No output parameters: Response from WFA: '+ resWfa);
          server.status = 'Contact Support';
          serverCreateJob.update('Failed', 'No Output parameters recieved' , server);
          server.save(function (err) {
            if (err) {
              logger.info('SVM Create: Failed to Save, Error: ' + err);
            }
          });
        }
      }
    });
  }
};

/**
 * Show the current server
 */
exports.read = function (req, res) {
  var dbWfa = require('./servers.server.wfa.db.read');
  var server = req.server.toObject();

  server.iopsTotal = '0';
  server.volumesCapacityTotal = '0';
  server.volumesUsedTotal = '0';

  server.serverId = server._id;

  if (req.server.pod && req.server.vlan) {
    server.networkRef = req.server.site.code + req.server.pod.code + _.padStart(req.server.vlan, 4, '0');
  }

  if (server.managed === "Customer") {
    delete server.iscsiAlias;
    delete server.iscsi;
    delete server.cifsSite;
    delete server.cifsOu;
    delete server.cifsDomain;
    delete server.cifsServername;
    delete server.cifsDnsServers;
    delete server.cifsDnsDomain;
    delete server.cifs;
    delete server.nfs;
    delete server.ipsSan;
  } else if (server.managed === "Portal") {
    delete server.ipVirtClus;
  }

  delete server.user;
  delete server.created;
  // Commented out. JL - 6 Mar 2018
  //delete server.vlan;
  delete server.pod;
  delete server._id;
  delete server.__v;

  dbWfa.svmRead(req.server.code, function (err, svm) {
    if (err) {
      logger.info('SVM Read: Failed to read WFA (Ignoring), Error: ' + err);
    } else {
      server.volumesName = svm.volumesName;
      server.volumesCapacity = svm.volumesCapacity;
      server.volumesUsed = svm.volumesUsed;
      server.volumesTier = svm.volumesTier;

      if (svm.iopsTotal) {
        server.iopsTotal = svm.iopsTotal.replace('IOPS', '');
      }

      if (svm.volumesCapacity) {
        server.volumesCapacityTotal = _.round(_.sum(_.map(svm.volumesCapacity.split(','), _.parseInt)) / 1024);
      }

      if (svm.volumesUsed) {
        server.volumesUsedTotal = _.round(_.sum(_.map(svm.volumesUsed.split(','), _.parseInt)) / 1024);
      }
    }

    logger.info('SVM Read: Server Object Returned: ' + util.inspect(server, {showHidden: false, depth: null}));
    sendServerResponse(res, server);
  });
};

/**
* updateSubscription
*/
var updateSubscription = function(server) {
  // update subscription for all dependents SGs
  var conditions = { server: mongoose.Types.ObjectId(server._id) },
    update = { subscription:  mongoose.Types.ObjectId(server.subscription._id)},
    options = { multi: true };

  var callback = function(err, res) {
    if (err) {
      logger.info(': Failed to save Storage group/ Storage unit object: ' + err);
    } else {
      logger.info(JSON.stringify(res));
    }
  };
  Storagegroup.update(conditions, update, options, callback);
  Storageunit.update(conditions, update, options, callback); 
  return;
};

/**
 * Update a server
 */
exports.update = function (req, res) {
  var serverUpdateJob;
  var wfaUpdateRequired = false;
  var clientWfa = require('./servers.server.wfa.svm.update');
  var server = req.server;
  var updateSubscriptionFlag = false;

  //If the request is from fix page and its root, he can modify the following parameters
  if (req.body.fromFix && _.includes(req.user.roles, 'root')) {
    logger.info('SVM Fix: Server Object: ' + util.inspect(server, {showHidden: false, depth: null}));
    logger.info('SVM Fix: Request Body: ' + util.inspect(req.body, {showHidden: false, depth: null}));

    server.pod = _.isUndefined(req.body.podId) ? server.pod : req.body.podId ;
    if(server.managed === 'Customer'){
      server.ipVirtClus = _.isUndefined(req.body.ipVirtClus) ? server.ipVirtClus : req.body.ipVirtClus ;
    }
    server.ipMgmt = _.isUndefined(req.body.ipMgmt) ? server.ipMgmt : req.body.ipMgmt ;
    server.code = _.isUndefined(req.body.code) ? server.code : req.body.code ;
    server.vlan = _.isUndefined(req.body.vlan) ? server.vlan : req.body.vlan ;
    server.status = _.isUndefined(req.body.status) ? server.status : req.body.status ;

    Job.create(req, 'server', function(err, updateJobRes) {
    serverUpdateJob = updateJobRes;
      server.save(function (err, serverSaved) {
         server.populate('partner','name code', function (errpoulated, serverPopulated) {
          server = serverPopulated;
          if (err) {
            logger.info('Server Fix: Failed to save Server object: ' + err);
            serverUpdateJob.update('Failed', 'Fix - Failed' , server);
            var errMsg = {};
            _.forOwn(err.errors, function(error, field) {
              logger.info(field, error.message);
              errMsg[field] = error.message;
            });
            return respondError(res, 400, errMsg);
          } else {
            logger.info('Server Fix: Fixed Successfully');
            serverUpdateJob.update('Completed', 'Fix - Applied' , sanitizeMessage.sanitizeObjectForLoggerMessage(server));
            res.json(serverSaved);
          }
        });
      });
    });
    return;
  }

  if (!_.isUndefined(req.body.subscriptionId) && server.subscription && server.subscription._id.toString() !== req.body.subscriptionId){
    if(mongoose.Types.ObjectId.isValid(req.body.subscriptionId)){
      server.subscription =  mongoose.Types.ObjectId(req.body.subscriptionId);
      updateSubscriptionFlag = true;
    } else {
      server.subscription = mongoose.Types.ObjectId();     
    }
    wfaUpdateRequired = true;
  }

  logger.info('SVM Update: Server Object: ' + util.inspect(sanitizeMessage.sanitizeObjectForLoggerMessage(server), {showHidden: false, depth: null}));
  logger.info('SVM Update: Request Body: ' + util.inspect(sanitizeMessage.sanitizeObjectForLoggerMessage(req.body), {showHidden: false, depth: null}));

  if (server.status !== 'Operational') {
    return res.status(400).send({
      message: 'Server is currently undergoing a different operation. Please wait until Status = Operational'
    });
  }

  var cifsUsername = req.body.cifsUsername || '';
  var cifsPassword = req.body.cifsPassword || '';
  var password = req.body.password || '';
  server.name = _.isUndefined(req.body.name) ? server.name : req.body.name;

  var enabledProtocol = {};

  if(server.managed === 'Portal'){
    if (req.body.password) {
      return respondError(res, 400, 'Password must be blank if Managed = Portal');
    }

    if(!_.isUndefined(req.body.nfs)){
      req.body.nfs = JSON.parse(req.body.nfs); // Parse string passed via http.
      if(!_.isBoolean(req.body.nfs)){
        return respondError(res, 400, 'NFS should be either true or false');
      }else{
        if(server.nfs && !req.body.nfs){
          return respondError(res, 400, 'Cannot disable NFS once enabled');
        }else if(!server.nfs && req.body.nfs){ // Enabling NFS for the first time
          server.nfs = req.body.nfs;
          enabledProtocol.nfs = true;
          wfaUpdateRequired = true;
        }
      }
    }

    if(!_.isUndefined(req.body.cifs)){
      req.body.cifs = JSON.parse(req.body.cifs); // Parse string passed via http.
      if(!_.isBoolean(req.body.cifs)){
        return respondError(res, 400, 'CIFS should be either true or false');
      }else{
        if(server.cifs && !req.body.cifs){
          return respondError(res, 400, 'Cannot disable CIFS once enabled');
        }else if(!server.cifs && req.body.cifs){ // Enabling CIFS for the first time and setting dependent fields
          server.cifs = req.body.cifs;
          if(!cifsUsername){
            return respondError(res, 400, 'cifsUsername is required');
          }
          if(!cifsPassword){
            return respondError(res, 400, 'cifsPassword is required');
          }
          server.cifsDnsDomain = req.body.cifsDnsDomain || '';
          server.cifsDnsServers = req.body.cifsDnsServers || '';
          server.cifsDomain = req.body.cifsDomain || '';
          server.cifsOu = req.body.cifsOu || '';
          server.cifsServername = req.body.cifsServername || '';
          server.cifsSite = req.body.cifsSite || '';
          enabledProtocol.cifs = true;
          wfaUpdateRequired = true;
        }
      }
    }

    if(!_.isUndefined(req.body.iscsi)){
      req.body.iscsi = JSON.parse(req.body.iscsi); // Parse string passed via http.
      if(!_.isBoolean(req.body.iscsi)){
        return respondError(res, 400, 'ISCSI should be either true or false');
      }else{
        if(server.iscsi && !req.body.iscsi){
          return respondError(res, 400, 'Cannot disable ISCSI once enabled');
        }else if(!server.iscsi && req.body.iscsi){ // Enabling ISCSI for the first time and setting dependent fields
          server.iscsi = req.body.iscsi;
          server.iscsiAlias = (!req.body.iscsiAlias)? null : req.body.iscsiAlias;
          enabledProtocol.iscsi = true;
          wfaUpdateRequired = true;
        }
      }
    }

  } else if (server.managed === 'Customer') {
    if (!_.isUndefined(req.body.password)){
      if (!password.match(/^(?=.*[0-9])(?=.*[a-zA-Z])\w{8,16}$/)) {
        return respondError(res, 400, 'Password length must be at least 8, must contain both characters and digits & no special characters are allowed');
      }
      wfaUpdateRequired = true;
    }
  }

  server.validate(function(err){
    if(err){
      var errMsg = {};
      _.forOwn(err.errors, function(error, field) {
        logger.info(field, error.message);
        errMsg[field] = error.message;
      });
      return respondError(res, 400, errMsg);
    }else{

      if (server.iscsi) {
        var firstNasIp = ip.fromLong(ip.toLong(server.ipMgmt) + 9);
        var lastNasIp = ip.fromLong(ip.toLong(server.ipMgmt) + 12);
        var lastNasIpLastOctet = lastNasIp.split(".")[3];
        server.ipsSan = firstNasIp + '-' + lastNasIpLastOctet;
      }
      server.status = wfaUpdateRequired ? 'Updating' : 'Operational';

      Job.create(req, 'server', function(err, updateJobRes) {
      serverUpdateJob = updateJobRes;
        server.save(function(err){
          if (err) {
            serverUpdateJob.update('Failed', "Err on Saving Server : " + err, server);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            server.populate('tenant','name code')
                  .populate('partner','name code')
                  .populate('subtenant','name code')
                  .populate('subscription','name code')
                  .populate('user', 'username')
                  .populate('site','name code', function (err, serverPopulated) {
              if (err){
                logger.info('SVM Update: Populate Error: ' + err);
                serverUpdateJob.update('Failed', "Err on Populate Server : " + err, server);
                return respondError(res, 400, errorHandler.getErrorMessage(err));
              } else {
                server = serverPopulated;
                logger.info('SVM Update: Server Populated: ' + util.inspect(server, {showHidden: false, depth: null}));
                sendServerResponse(res, server);
                // change the subscription of SGs and SUs if server's subscription is changed
                if (updateSubscriptionFlag) {
                  updateSubscription(server);
                }
                if (wfaUpdateRequired){
                  updateSvm();
                } else {
                  serverUpdateJob.update('Completed', 'Server Updated', server);
                }
              }
            });
          }
        });
      });
    }
  });



  function updateSvm() {
    // var args = {
    //   code: server.code,
    //   subscriptionCode: server.subscription.code,
    //   password: password,
    //   nfs: server.nfs,
    //   iscsi: server.iscsi,
    //   iscsiAlias: server.iscsiAlias,
    //   cifs: server.cifs,
    //   cifsDnsDomain: server.cifsDnsDomain,
    //   cifsDnsServers: server.cifsDnsServers,
    //   cifsDomain: server.cifsDomain,
    //   cifsOu: server.cifsOu,
    //   cifsServername: server.cifsServername,
    //   cifsSite: server.cifsSite,
    //   cifsUsername: cifsUsername,
    //   cifsPassword: cifsPassword
    // };

    var args = {
      code: server.code,
      subscriptionCode: server.subscription.code,
      password: password
    };

    if (enabledProtocol.nfs) {
      args.nfs = server.nfs;
    }

    if (enabledProtocol.cifs) {      
      args.cifs = server.cifs;
      args.cifsDnsDomain = server.cifsDnsDomain;
      args.cifsDnsServers = server.cifsDnsServers;
      args.cifsDomain = server.cifsDomain;
      args.cifsOu = server.cifsOu;
      args.cifsServername = server.cifsServername;
      args.cifsSite = server.cifsSite;
      args.cifsUsername = cifsUsername;
      args.cifsPassword = cifsPassword;
    }

    if (enabledProtocol.iscsi) {
      args.iscsi = server.iscsi;
      args.iscsiAlias = server.iscsiAlias;
    }

    var jobId;

    logger.info('SVM Update: Args for WFA' + util.inspect(sanitizeMessage.sanitizeObjectForLoggerMessage(args), {showHidden: false, depth: null}));
    clientWfa.svmUpdateExec(args, function (err, resWfa) {
      if (err) {
        logger.info('SVM Update: Failed to update - Error: ' + err);
        server.status = 'Contact Support';
        serverUpdateJob.update('Failed', "Err on Update Server : " + err, server);
        server.save(function (err) {
          if (err) {
            logger.info('SVM Update: Failed to Save, Error: ' + err);
          }
        });
      } else {
        jobId = resWfa.jobId;
        logger.info('SVM Update: Response for WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilUpdated(jobId);
      }
    });
  }

  function untilUpdated(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.svmUpdateStatus(args, function (err, resWfa) {
      if (err) {
        logger.info('SVM Update: Failed to obtain status - Error : '+ err);
        server.status = 'Contact Support';
        serverUpdateJob.update('Failed', "Failed to Obtain Status : " + err, server);
        server.save(function (err) {
          if (err) {
            logger.info('SVM Update: Failed to Save, Error: ' + err);
          }
        });
      } else {
        if (resWfa.jobStatus === 'FAILED') {
          logger.info('SVM Update: Failed to update SVM, Job ID: ' + jobId);
          server.status = 'Contact Support';
          serverUpdateJob.update('Failed', 'Recieved Failed status from WFA', server);
          server.save(function (err) {
            if (err) {
              logger.info('SVM Update: Failed to Save, Error: ' + err);
            }
          });
        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('SVM Update: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilUpdated(jobId); }, config.wfa.refreshRate);
        } else {
          server.status = 'Operational';
          serverUpdateJob.update('Completed', 'Server Updated', server);
          server.save(function (err) {
            if (err) {
              logger.info('SVM Update: Failed to Save, Error: ' + err);
            }
          });
        }
      }
    });
  }
};

/**
 * Delete a server
 */
exports.delete = function (req, res) {
  var clientWfa = require('./servers.server.wfa.svm.delete');
  var serverDeleteJob;
  var server = req.server;

  if (server.status !== 'Operational') {
    return res.status(400).send({
      message: 'Server is currently undergoing a different operation. Please wait until Status = Operational'
    });
  }

  server.status = 'Deleting';

  //check for dependent Storage Groups
  Storagegroup.find({ 'server': mongoose.Types.ObjectId(server._id) }).exec(function (err, storagegroups) {
    if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
    if (storagegroups.length > 0)
      return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated Storage Groups are deleted');
    if (server.managed === 'Customer') {
      Icr.find({ 'server': mongoose.Types.ObjectId(server._id) }).exec(function (err, icrs) {
        var isICRDependent = false;
        if (err) return respondError(res, 400, errorHandler.getErrorMessage(err));
        if (icrs.length > 0) {
          _.forEach(icrs, function(value, key) {
            if (value.status !== 'Closed'){
              isICRDependent = true;
              return false;
            }
          });
        }
        if(isICRDependent)
          return respondError(res, 400, 'Can\'t perform Delete: Please ensure all associated ICRs are deleted.');
        deleteServer();
      });
    }else{
      deleteServer();
    }
  });

  function deleteServer() {
    Job.create(req, 'server', function(err, deleteJobRes) {
    serverDeleteJob = deleteJobRes;
      server.save(function(err) {
        server.populate('partner', 'name code', function(errpoulated, serverPopulated) {
          server = serverPopulated;
          if (err) {
            serverDeleteJob.update('Failed', 'Failed to Save', server);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            logger.info('Server Delete: Delete Status Updated Successfully: ' + util.inspect(sanitizeMessage.sanitizeObjectForLoggerMessage(server), {showHidden: false, depth: null}));
            res.status(200).send();
            deleteSvm();
          }
        });
      });
    });
  }

  function deleteSvm() {
    var args = {
      serverCode: server.code
    };
    var jobId;

    logger.info('SVM Delete: Args for WFA' + util.inspect(args, {showHidden: false, depth: null}));
    clientWfa.svmDeleteExec(args, function (err, resWfa) {
      if (err) {
        logger.info('SVM Delete: Failed to delete vFas - Error : '+ err);
        server.status = 'Contact Support';
        serverDeleteJob.update('Failed', 'Failed to Delete in WFA', server);
        server.save(function (err) {
          if (err) {
            logger.info('SVM Delete: Failed to Save, Error: ' + err);
          }
        });
      } else {
        jobId = resWfa.jobId;
        logger.info('SVM Delete: Response from WFA' + util.inspect(resWfa, {showHidden: false, depth: null}));
        untilDeleted(jobId);
      }
    });
  }

  function untilDeleted(jobId) {
    var args = {
      jobId: jobId
    };

    clientWfa.svmDeleteStatus(args, function (err, resWfa) {
      if (err) {
        logger.info('SVM Delete: Failed to obtain status, Job ID: ' + jobId);
        server.status = 'Contact Support';
        serverDeleteJob.update('Failed', 'Failed to Obtain Status', server);
        server.save(function (err) {
          if (err) {
            logger.info('SVM Delete: Failed to Save, Error: ' + err);
          }
        });
      } else {
        if (resWfa.jobStatus === 'FAILED') {
          logger.info('SVM Delete: Failed to delete SVM, Job ID: ' + jobId);
          server.status = 'Contact Support';
          serverDeleteJob.update('Failed', 'Recieved Failed status form WFA', server);
          server.save(function (err) {
            if (err) {
              logger.info('SVM Delete: Failed to Save, Error: ' + err);
            }
          });
        } else if (resWfa.jobStatus !== 'COMPLETED') {
          logger.info('SVM Delete: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
          setTimeout(function () { untilDeleted(jobId); }, config.wfa.refreshRate);
        } else {
          server.status = 'Deleted';
          serverDeleteJob.update('Completed', 'Server Deleted', server);
          server.remove(function (err) {
            if (err) logger.info('Server Delete: Failed to delete object: ' + err);
          });
        }
      }
    });
  }
};

/**
 * List of Servers
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var query;
  if (featuresSettings.server.gateway.enabled) {
    query = Server.find({});
  } else {
    query = Server.find({}, { 'gateway': 0 });
  }
  query
    .populate('tenant','name code')
    .populate('partner','name code')
    .populate('subtenant','name code')
    .populate('site','name code')
    .populate('subscription','name code');

  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
  } else if (_.includes(req.user.roles, 'partner')) {
    query.where({ $or:[ {'tenant':req.user.tenant }, {'partner':req.user.tenant } ] });
  } else {
    query.where({ 'tenant': req.user.tenant });
  }

  query.exec(function (err, servers) {
    respondList(err, servers);
  });

  function respondList(err, servers) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      res.json(servers);
    }
  }
};

/**
 * Server middleware
 */
exports.serverByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return respondError(res, 404, 'Server is invalid');
  }

  Server.findById(id).populate('tenant','name code')
                     .populate('partner','name code')
                     .populate('subtenant','name code')
                     .populate('site','name code')
                     .populate('pod','name code')
                     .populate('subscription','name code')
                     .populate('user','tenant').exec(function (err, server) {
    if (err) {
      return next(err);
    } else if (!server) {
      return respondError(res, 404, 'No server with that identifier has been found');
    }
    req.server = server;
    next();
  });
};



