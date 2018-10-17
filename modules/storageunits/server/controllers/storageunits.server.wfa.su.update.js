/**
 * Created by Ashwini on 19-May-16.
 */
'use strict';

var Client = require('node-rest-client').Client,
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  config = require(path.resolve('./config/config'));

var client = new Client(config.wfa.httpsClientOptions);

exports.suUpdateExec = function (req, res) {

  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.server || '') + '" key="vserver"/>' +
      '<userInputEntry value="' + (req.storagegroup || '') + '" key="volume"/>' +
      '<userInputEntry value="' + (req.storageunit || '') + '" key="unit"/>' +
      '<userInputEntry value="' + (req.size_mb || '') + '" key="size_mb"/>' +
      '<userInputEntry value="' + (req.acl_add || '') + '" key="acl_add"/>' +
      '<userInputEntry value="' + (req.acl_remove || '') + '" key="acl_remove"/>'+
      '</userInputValues>' +
      '<comments>DFaaS Engine Storage Unit Update: ' + req.storagegroup + ' ' + req.storageunit + '</comments>' +
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

  //logger.info('StrUnit WFA Update: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var suUpdateReq = client.post(config.wfa.suUpdateJob, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrUnit WFA Update: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('StrUnit WFA Update: No Job ID received');
    }
  });

  suUpdateReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrUnit WFA Update: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrUnit WFA Update: Request Timeout');
  });

  suUpdateReq.on('responseTimeout', function (resWfa) {
    logger.info('StrUnit WFA Update: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrUnit WFA Update: Response Timeout');
  });

  suUpdateReq.on('error', function (errWfa) {
    logger.info('StrUnit WFA Update: Something went wrong on the request: ', errWfa.request.options);
    res('StrUnit WFA Update: Error');
  });
};


exports.suUpdateStatus = function (req, res) {

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

  //logger.info('StrUnit WFA UpdateStatus: Args' + util.inspect(args, {showHidden: false, depth: null}));

  var suUpdateStatusReq = client.get(config.wfa.suUpdateJob + '/${jobId}', args, function (data) {
    var suOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrUnit WFA UpdateStatus: Received' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      suOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, suOut);
    } else {
      res('StrUnit WFA UpdateStatus: No Status received');
    }
  });

  suUpdateStatusReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrUnit WFA UpdateStatus: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrUnit WFA UpdateStatus: Request Timeout');
  });

  suUpdateStatusReq.on('responseTimeout', function (resWfa) {
    logger.info('StrUnit WFA UpdateStatus: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrUnit WFA UpdateStatus: Response Timeout');
  });

  suUpdateStatusReq.on('error', function (errWfa) {
    logger.info('StrUnit WFA UpdateStatus: Something went wrong on the request: ', errWfa.request.options);
    res('StrUnit WFA UpdateStatus: Error');
  });
};

// There is no output from the Storage Unit Update Workflow
