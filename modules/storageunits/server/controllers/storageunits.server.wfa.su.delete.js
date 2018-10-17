/**
* created by Ashwini on 17-May-2016
*/
'use strict';

var Client = require('node-rest-client').Client,
	path = require('path'),
  util = require('util'),
	logger = require(path.resolve('./config/lib/log')),
	config = require(path.resolve('./config/config'));

var client = new Client(config.wfa.httpsClientOptions);

exports.suDeleteExec = function (req, res) {

	var args = {
		headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    data: '<workflowInput>' +
      '<userInputValues>' +
      '<userInputEntry value="' + (req.server || '') + '" key="vserver"/>' +
      '<userInputEntry value="' + (req.storagegroup || '') + '" key="volume"/>' +
      '<userInputEntry value="' + (req.storageunit || '') + '" key="unit"/>' +
      '</userInputValues>' +
      '<comments>DFaaS Engine Storage Unit Delete: ' + req.storagegroup + ' ' + req.storageunit + '</comments>' +
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

  //logger.info('StrUnit WFA delete: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var suDeleteReq = client.post(config.wfa.suDeleteJob, args, function(data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrUnit WFA Delete: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$){
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('StrUnit WFA WFA Delete: No Job ID received');
    }
  });

  suDeleteReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrUnit WFA Delete: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrUnit WFA Delete: Request Timeout');
  });

  suDeleteReq.on('responseTimeout', function (resWfa) {
    logger.info('StrUnit WFA Delete: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrUnit WFA Delete: Response Timeout');
  });

  suDeleteReq.on('error', function (errWfa) {
    logger.info('StrUnit WFA Delete: Something went wrong on the request: ', errWfa.request.options);
    res('StrUnit WFA Delete: Error');
  });
};


exports.suDeleteStatus = function (req, res) {

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

  var suDeleteStatusReq = client.get(config.wfa.suDeleteJob + '/${jobId}', args, function (data) {
    var suOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    logger.info('StrUnit WFA DeleteStatus: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      suOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
      };
      res(null, suOut);
    } else {
      res('StrUnit WFA DeleteStatus: No Status received');
    }
  });

  suDeleteStatusReq.on('requestTimeout', function (reqWfa) {
    logger.info('StrUnit WFA DeleteStatus: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('StrUnit WFA DeleteStatus: Request Timeout');
  });

  suDeleteStatusReq.on('responseTimeout', function (resWfa) {
    logger.info('StrUnit WFA DeleteStatus: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('StrUnit WFA DeleteStatus: Response Timeout');
  });

  suDeleteStatusReq.on('error', function (errWfa) {
    logger.info('StrUnit WFA DeleteStatus: Something went wrong on the request: ', errWfa.request.options);
    res('StrUnit WFA DeleteStatus: Error');
  });
};
