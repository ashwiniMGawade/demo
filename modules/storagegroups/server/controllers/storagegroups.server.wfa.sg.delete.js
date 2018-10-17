'use strict';

var Client = require('node-rest-client').Client,
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config'));

// direct way
var client = new Client(config.wfa.httpsClientOptions);

exports.sgDeleteExec = function (req, res) {

  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.code || '') + '" key="volume"/>' +
      '<userInputEntry value="' + (req.server || '') + '" key="vserver"/>' +
      '</userInputValues>' +
      '<comments>DFaaS Engine SG Delete: ' + req.server + ' ' + req.code + '</comments>' +
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

  //logger.info('StrGroup WFA Delete: Args' + util.inspect(args, {showHidden: false, depth: null}));

  var sgDeleteReq = client.post(config.wfa.sgDeleteJob, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrGroup WFA Delete: Data Received from WFA: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('StrGroup WFA Delete: No Job ID received');
    }
  });

  sgDeleteReq.on('requestTimeout', function (req) {
    logger.info('StrGroup WFA Delete: Request expired - Request: ' + util.inspect(req, {showHidden: false, depth: null}));
    req.abort();
    res('StrGroup WFA Delete: Request Timeout');
  });

  sgDeleteReq.on('responseTimeout', function (res) {
    logger.info('SStrGroupVM WFA Delete: Response expired - Response: ' + util.inspect(res, {showHidden: false, depth: null}));
    res('StrGroup WFA Delete: Response Timeout');
  });

  sgDeleteReq.on('error', function (err) {
    logger.info('StrGroup WFA Delete: Something went wrong on the request - Options: ', err.request.options);
    res('StrGroup WFA Delete: Error');
  });
};


exports.sgDeleteStatus = function (req, res) {

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

  //logger.info('StrGroup WFA DeleteStatus: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var sgDeleteStatusReq = client.get(config.wfa.sgDeleteJob + '/${jobId}', args, function (data) {
    var sgOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrGroup WFA DeleteStatus: Data Received from WFA: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      sgOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, sgOut);
    } else {
      res('StrGroup WFA: While Obtaining Storage Group Deletion Status - No Status received');
    }
  });

  sgDeleteStatusReq.on('requestTimeout', function (req) {
    logger.info('StrGroup WFA DeleteStatus: Request expired - Request: ' + util.inspect(req, {showHidden: false, depth: null}));
    req.abort();
    res('StrGroup WFA DeleteStatus: Request Timeout');
  });

  sgDeleteStatusReq.on('responseTimeout', function () {
    logger.info('StrGroup WFA DeleteStatus: Response expired - Response: ' + util.inspect(res, {showHidden: false, depth: null}));
    res('StrGroup WFA DeleteStatus: Response Timeout');
  });

  sgDeleteStatusReq.on('error', function (err) {
    logger.info('StrGroup WFA DeleteStatus: Something went wrong on the request: ', err.request.options);
    res('StrGroup WFA DeleteStatus: Error');
  });
};

// There is no output from the SG Delete Workflow
