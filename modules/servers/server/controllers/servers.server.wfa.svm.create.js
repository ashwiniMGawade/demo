'use strict';

var Client = require('node-rest-client').Client,
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  config = require(path.resolve('./config/config'));

var client = new Client(config.wfa.httpsClientOptions);

exports.svmCreateExec = function (req, res) {

  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.vlan || '') + '" key="vlan"/>' +
      '<userInputEntry value="' + (req.ipBase || '') + '" key="ip_base"/>' +
      '<userInputEntry value="' + (req.subnetMask || '') + '" key="subnetmask"/>' +
      '<userInputEntry value="' + (req.gateway || '') + '" key="gateway"/>' +
      '<userInputEntry value="' + (req.subtenantCode || '') + '" key="subtenant"/>' +
      '<userInputEntry value="' + (req.tenantCode || '') + '" key="tenant"/>' +
      '<userInputEntry value="' + (req.subscriptionCode || '') + '" key="subscription"/>' +
      '<userInputEntry value="' + (req.clusterName || '') + '" key="cluster_name"/>' +
      // '<userInputEntry value="' + (req.password || '') + '" key="password"/>' +
      '</userInputValues>' +
      '<comments>DFaaS Engine SVM Create: ' + req.tenantCode + ' ' + req.subtenantCode + '</comments>' +
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

  //logger.info('SVM WFA Create: Args : ' + util.inspect(args, {showHidden: false, depth: null}));
  console.log("vfasscreaejob", config.wfa.vFasCreateJob);
  var svmCreateReq = client.post(config.wfa.vFasCreateJob, args, function (data, response) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('SVM WFA Create: Data received from WFA: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('SVM WFA Create: No Job ID received');
    }
  });

  svmCreateReq.on('requestTimeout', function (reqWfa) {
    logger.info('SVM WFA Create: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('SVM WFA Create: Request Timeout');
  });

  svmCreateReq.on('responseTimeout', function (resWfa) {
    logger.info('SVM WFA Create: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('SVM WFA Create: Response Timeout');
  });

  svmCreateReq.on('error', function (errWfa) {
    logger.info('SVM WFA Create: Error - Options: ', errWfa.request.options);
    res('SVM WFA Create: Error');
  });
};


exports.svmCreateStatus = function (req, res) {

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

  //logger.info('SVM WFA CreateStatus: Args:' + util.inspect(args, {showHidden: false, depth: null}));

  var svmCreateStatusReq = client.get(config.wfa.vFasCreateJob + '/${jobId}', args, function (data) {
    var svmOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('SVM WFA CreateStatus: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      svmOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, svmOut);
    } else {
      res('SVM WFA CreateStatus: No Status received');
    }
  });

  svmCreateStatusReq.on('requestTimeout', function (reqWfa) {
    logger.info('SVM WFA CreateStatus: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('SVM WFA CreateStatus: Request Timeout');
  });

  svmCreateStatusReq.on('responseTimeout', function (resWfa) {
    logger.info('SVM WFA CreateStatus: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('SVM WFA CreateStatus: Response Timeout');
  });

  svmCreateStatusReq.on('error', function (errWfa) {
    logger.info('SVM WFA CreateStatus: Error - Options ', errWfa.request.options);
    res('SVM WFA CreateStatus: Error');
  });
};


exports.svmCreateOut = function (req, res) {

  var args = {
    path:{ 'jobId': req.jobId },
    headers:{ 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
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

  //logger.info('SVM WFA CreateOut: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var svmCreateOutReq = client.get(config.wfa.vFasCreateJob + '/${jobId}/plan/out', args, function (data) {
    var svmOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }
    console.log("job id=" + req.jobId);

    logger.info('SVM WFA CreateOut: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.collection) {
      svmOut = {
        ipVirtClus: data.collection.keyAndValuePair[0].$.value,
        ipMgmt: data.collection.keyAndValuePair[1].$.value,
        code: data.collection.keyAndValuePair[2].$.value
      };
      res(null, svmOut);
    } else {
      res('SVM WFA CreateOut: No Output received');
    }
  });

  svmCreateOutReq.on('requestTimeout', function (reqWfa) {
    logger.info('SVM WFA CreateOut: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('SVM WFA CreateOut: Request Timeout');
  });

  svmCreateOutReq.on('responseTimeout', function (resWfa) {
    logger.info('SVM WFA CreateOut: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('SVM WFA CreateOut: Response Timeout');
  });

  svmCreateOutReq.on('error', function (errWfa) {
    logger.info('SVM WFA CreateOut: Error - Options: ', errWfa.request.options);
    res('SVM WFA CreateOut: Error');
  });
};
