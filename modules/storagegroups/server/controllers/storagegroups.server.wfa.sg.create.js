'use strict';

var Client = require('node-rest-client').Client,
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config'));

// direct way
var client = new Client(config.wfa.httpsClientOptions);

exports.sgCreateExec = function (req, res) {

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
      '<comments>DFaaS Engine SG Create: ' + req.server + ' ' + req.code + '</comments>' +
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

  //logger.info('StrGroup WFA Create: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var sgCreateReq = client.post(config.wfa.sgCreateJob, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrGroup WFA Create: Data received from WFA: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('StrGroup WFA Create: No Job ID received');
    }
  });

  sgCreateReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrGroup WFA Create: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrGroup WFA Create: Request Timeout');
  });

  sgCreateReq.on('responseTimeout', function (resWfa) {
    logger.info('StrGroup WFA Create: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrGroup WFA Create: Response Timeout');
  });

  sgCreateReq.on('error', function (errWfa) {
    logger.info('StrGroup WFA Create: Something went wrong on the request: ', errWfa.request.options);
    res('StrGroup WFA Create: Error');
  });
};


exports.sgCreateStatus = function (req, res) {

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

  //logger.info('StrGroup WFA CreateStatus: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var sgCreateStatusReq = client.get(config.wfa.sgCreateJob + '/${jobId}', args, function (data) {
    var sgOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrGroup WFA CreateStatus: Data received from WFA: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      sgOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, sgOut);
    } else {
      res('StrGroup WFA CreateStatus: No Status received');
    }
  });

  sgCreateStatusReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrGroup WFA CreateStatus: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrGroup WFA CreateStatus: Request Timeout');
  });

  sgCreateStatusReq.on('responseTimeout', function (resWfa) {
    logger.info('StrGroup CreateStatus: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrGroup WFA CreateStatus: Response Timeout');
  });

  sgCreateStatusReq.on('error', function (errWfa) {
    logger.info('StrGroup CreateStatus: Something went wrong on the request: ', errWfa.request.options);
    res('StrGroup WFA CreateStatus: Error');
  });
};
