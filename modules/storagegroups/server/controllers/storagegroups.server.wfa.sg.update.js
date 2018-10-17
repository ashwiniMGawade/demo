'use strict';

var Client = require('node-rest-client').Client,
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config'));

// direct way
var client = new Client(config.wfa.httpsClientOptions);

exports.sgUpdateExec = function (req, res) {

  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.code || '') + '" key="volume"/>' +
      '<userInputEntry value="' + (req.annotation || '') + '" key="comment"/>' +
      '<userInputEntry value="' + (req.server || '') + '" key="vserver"/>' +
      '<userInputEntry value="' + (req.tier || '') + '" key="tier"/>' +
      '<userInputEntry value="' + (req.snapshotPolicy || '') + '" key="policy_snapshot"/>' +
      '</userInputValues>' +
      '<comments>DFaaS Engine SG Update: ' + req.server + ' ' + req.code + '</comments>' +
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

  //logger.info('StrGroup WFA Update: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var sgUpdateReq = client.post(config.wfa.sgUpdateJob, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrGroup WFA Update: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('StrGroup WFA Update: No Job ID received');
    }
  });

  sgUpdateReq.on('requestTimeout', function (req) {
    logger.info('StrGroup WFA Update: Request expired - Request: ' + util.inspect(req, {showHidden: false, depth: null}));
    req.abort();
    res('StrGroup WFA Update: Request Timeout');
  });

  sgUpdateReq.on('responseTimeout', function (res) {
    logger.info('StrGroup WFA Update: Response expired - Response: ' + util.inspect(res, {showHidden: false, depth: null}));
    res('StrGroup WFA Update: Response Timeout');
  });

  sgUpdateReq.on('error', function (err) {
    logger.info('StrGroup WFA Update: Something went wrong on the request - Options: ', err.request.options);
    res('StrGroup WFA Update: Error');
  });
};


exports.sgUpdateStatus = function (req, res) {

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

  //logger.info('StrGroup WFA UpdateStatus: Args' + util.inspect(args, {showHidden: false, depth: null}));

  var sgUpdateStatusReq = client.get(config.wfa.sgUpdateJob + '/${jobId}', args, function (data) {
    var sgOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrGroup WFA UpdateStatus: Received' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      sgOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, sgOut);
    } else {
      res('StrGroup WFA UpdateStatus: No Status received');
    }
  });

  sgUpdateStatusReq.on('requestTimeout', function (req) {
    logger.info('StrGroup WFA UpdateStatus: Request expired - Request : ' + util.inspect(req, {showHidden: false, depth: null}));
    req.abort();
    res('StrGroup WFA UpdateStatus: Request Timeout');
  });

  sgUpdateStatusReq.on('responseTimeout', function () {
    logger.info('StrGroup WFA UpdateStatus: Response expired - Response : ' + util.inspect(res, {showHidden: false, depth: null}));
    res('StrGroup WFA UpdateStatus: Response Timeout');
  });

  sgUpdateStatusReq.on('error', function (err) {
    logger.info('StrGroup WFA UpdateStatus: Something went wrong on the request', err.request.options);
    res('StrGroup WFA UpdateStatus: Error');
  });
};

// There is no output from the SG Update Workflow
