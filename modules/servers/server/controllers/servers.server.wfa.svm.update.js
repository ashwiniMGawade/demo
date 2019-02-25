'use strict';

var Client = require('node-rest-client').Client,
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  config = require(path.resolve('./config/config'));

// direct way
var client = new Client(config.wfa.httpsClientOptions);

exports.svmUpdateExec = function (req, res) {

  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.code || '') + '" key="vserver_name"/>' +
      '<userInputEntry value="' + (req.subscriptionCode || '') + '" key="subscription"/>' +
      // '<userInputEntry value="' + (req.password || '') + '" key="password"/>' +
      '<userInputEntry value="' + (req.nfs || '') + '" key="nfs_enable"/>' +
      '<userInputEntry value="' + (req.iscsi || '') + '" key="iscsi_enable"/>' +
      '<userInputEntry value="' + (req.iscsiAlias || '') + '" key="iscsi_alias"/>' +
      '<userInputEntry value="' + (req.cifs || '') + '" key="cifs_enable"/>' +
      '<userInputEntry value="' + (req.cifsDnsDomain || '') + '" key="cifs_dnsdomain"/>' +
      '<userInputEntry value="' + (req.cifsDnsServers || '') + '" key="cifs_dnsservers"/>' +
      '<userInputEntry value="' + (req.cifsDomain || '') + '" key="cifs_domain"/>' +
      '<userInputEntry value="' + (req.cifsOu || '') + '" key="cifs_ou"/>' +
      '<userInputEntry value="' + (req.cifsServername || '') + '" key="cifs_servername"/>' +
      '<userInputEntry value="' + (req.cifsSite || '') + '" key="cifs_site"/>' +
      '<userInputEntry value="' + (req.cifsUsername || '') + '" key="cifs_username"/>' +
      '<userInputEntry value="' + (req.cifsPassword || '') + '" key="cifs_password"/>' +
      '</userInputValues>' +
      '<comments>DFaaS Engine SVM Update: ' + req.code + '</comments>' +
      '</workflowInput>',
    requestConfig: {
      timeout: 60000,
      noDelay: true,
      keepAlive: true,
      keepAliveDelay: 10000
    },
    responseConfig: {
      timeout: 60000
    }
  };

  //logger.info('SVM WFA Update: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var svmUpdateReq = client.post(config.wfa.vFasUpdateJob, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('SVM WFA Update: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('SVM WFA Update: No Job ID received');
    }
  });

  svmUpdateReq.on('requestTimeout', function (reqWfa) {
    logger.info('SVM WFA Update: Request expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('SVM WFA Update: Request Timeout');
  });

  svmUpdateReq.on('responseTimeout', function (resWfa) {
    logger.info('SVM WFA Update: Response expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('SVM WFA Update: Response Timeout');
  });

  svmUpdateReq.on('error', function (errWfa) {
    logger.info('SVM WFA Update: Error - Options: ', errWfa.request.options);
    res('SVM WFA Update: Error');
  });
};


exports.svmUpdateStatus = function (req, res) {

  var args = {
    path:{ 'jobId': req.jobId },
    headers:{ 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    requestConfig: {
      timeout: 30000,
      noDelay: true,
      keepAlive: true,
      keepAliveDelay: 10000
    },
    responseConfig: {
      timeout: 30000
    }
  };

  //logger.info('SVM WFA UpdateStatus: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var svmUpdateStatusReq = client.get(config.wfa.vFasUpdateJob + '/${jobId}', args, function (data) {
    var svmOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('SVM WFA UpdateStatus: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      svmOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, svmOut);
    } else {
      res('SVM WFA UpdateStatus: No Status received');
    }
  });

  svmUpdateStatusReq.on('requestTimeout', function (reqWfa) {
    logger.info('SVM WFA UpdateStatus: Request expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('SVM WFA UpdateStatus: Request Timeout');
  });

  svmUpdateStatusReq.on('responseTimeout', function (resWfa) {
    logger.info('SVM WFA UpdateStatus: Response expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('SVM WFA UpdateStatus: Response Timeout');
  });

  svmUpdateStatusReq.on('error', function (errWfa) {
    logger.info('SVM WFA UpdateStatus: Error - Options: ', errWfa.request.options);
    res('SVM WFA UpdateStatus: Error');
  });
};

// There is no output from the SVM Update Workflow
