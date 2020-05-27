/**
 * Created by ashwini on 16-May-2016.
 */
'use strict';

var Client = require('node-rest-client').Client,
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  config = require(path.resolve('./config/config'));

var client = new Client(config.wfa.httpsClientOptions);

exports.suCreateExec = function (req, res) {

  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.code || '') + '" key="unit"/>' +
      '<userInputEntry value="' + (req.protocol || '') + '" key="protocol"/>' +
      '<userInputEntry value="' + (req.server || '') + '" key="vserver"/>' +
      '<userInputEntry value="' + (req.storagegroup || '') + '" key="volume"/>' +
      '<userInputEntry value="' + (req.size_mb || '') + '" key="size_mb"/>' +
      '<userInputEntry value="' + (req.acl || '') + '" key="acl"/>' +
      '<userInputEntry value="' + (req.lun_os || '') + '" key="lun_os"/>' +
      '<userInputEntry value="' + (req.lun_id || '') + '" key="lun_id"/>' +
      '</userInputValues>' +
      '<comments>DFaaS Engine Storage unit Create: ' + req.storagegroup + ' ' + req.code + '</comments>' +
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

  //logger.info('StrUnit WFA Create: Args:' + util.inspect(args, {showHidden: false, depth: null}));

  var suCreateReq = client.post(config.wfa.suCreateJob, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrUnit WFA Create: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('StrUnit WFA Create: No Job ID received');
    }
  });

  suCreateReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrUnit WFA Create: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrUnit WFA Create: Request Timeout');
  });

  suCreateReq.on('responseTimeout', function (resWfa) {
    logger.info('StrUnit WFA Create: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrUnit WFA Create: Response Timeout');
  });

  suCreateReq.on('error', function (errWfa) {
    logger.info('StrUnit WFA Create: Something went wrong on the request: ', errWfa.request.options);
    res('StrUnit WFA Create: Error');
  });
};


exports.suCreateStatus = function (req, res) {

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

  //logger.info('StrUnit WFA CreateStatus: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var suCreateStatusReq = client.get(config.wfa.suCreateJob + '/${jobId}', args, function (data) {
    var suOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrUnit WFA CreateStatus: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      suOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, suOut);
    } else {
      res('StrUnit WFA CreateStatus: No Status received');
    }
  });

  suCreateStatusReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrGroup WFA CreateStatus: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrUnit WFA CreateStatus: Request Timeout');
  });

  suCreateStatusReq.on('responseTimeout', function (resWfa) {
    logger.info('StrGroup CreateStatus: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrUnit WFA CreateStatus: Response Timeout');
  });

  suCreateStatusReq.on('error', function (errWfa) {
    logger.info('StrGroup CreateStatus: Something went wrong on the request: ', errWfa.request.options);
    res('StrUnit WFA CreateStatus: Error');
  });
};
