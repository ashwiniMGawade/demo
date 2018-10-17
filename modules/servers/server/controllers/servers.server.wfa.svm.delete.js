'use strict';

var Client = require('node-rest-client').Client,
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  config = require(path.resolve('./config/config'));

// direct way
var client = new Client(config.wfa.httpsClientOptions);

exports.svmDeleteExec = function (req, res) {

  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.serverCode || '') + '" key="name"/>' +
      '</userInputValues>' +
      '<comments>DFaaS Engine SVM Delete: ' + req.serverCode + '</comments>' +
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

  //logger.info('SVM WFA Delete: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var svmDeleteReq = client.post(config.wfa.vFasDeleteJob, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('SVM WFA Delete: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('SVM WFA Delete: No Job ID received');
    }
  });

  svmDeleteReq.on('requestTimeout', function (reqWfa) {
    logger.info('SVM WFA Delete: Request expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('SVM WFA Delete: Request Timeout');
  });

  svmDeleteReq.on('responseTimeout', function (resWfa) {
    logger.info('SVM WFA Delete: Response expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('SVM WFA Delete: Response Timeout');
  });

  svmDeleteReq.on('error', function (errWfa) {
    logger.info('SVM WFA Delete: Error - Options: ', errWfa.request.options);
    res('SVM WFA Delete: Error');
  });
};


exports.svmDeleteStatus = function (req, res) {

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

  //logger.info('SVM WFA DeleteStatus: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var svmDeleteStatusReq = client.get(config.wfa.vFasDeleteJob + '/${jobId}', args, function (data) {
    var svmOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('SVM WFA DeleteStatus: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      svmOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, svmOut);
    } else {
      res('SVM WFA DeleteStatus: No Status received');
    }
  });

  svmDeleteStatusReq.on('requestTimeout', function (reqWfa) {
    logger.info('SVM WFA DeleteStatus: Request expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('SVM WFA DeleteStatus: Request Timeout');
  });

  svmDeleteStatusReq.on('responseTimeout', function (resWfa) {
    logger.info('SVM WFA DeleteStatus: Response expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('SVM WFA DeleteStatus: Response Timeout');
  });

  svmDeleteStatusReq.on('error', function (errWfa) {
    logger.info('SVM WFA DeleteStatus: Error - Options: ', errWfa.request.options);
    res('SVM WFA DeleteStatus: Error');
  });
};

// There is no output from the SVM Delete Workflow
