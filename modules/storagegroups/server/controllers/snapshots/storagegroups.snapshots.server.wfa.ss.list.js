/**
 * Created by Ashwini on 30-June-16.
 */
'use strict';

var Client = require('node-rest-client').Client,
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config'));

var options = {
      connection: {
        rejectUnauthorized: false,
        headers: {
          'Authorization': config.APIservice.authorization,
          'Content-Type': 'application/json'
        }
      },
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

var client = new Client(options);

exports.ssServerDetailsExec = function (req, res) {

  var serverName = req.server;
  var serverDetailsAPIRequestURL = config.APIservice.serverDetails + '?name=' + serverName;
  logger.info("Server Details API Service Request URL : " + serverDetailsAPIRequestURL);
  var ssListReq = client.get(serverDetailsAPIRequestURL, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }
    logger.info('Snapshot API server Details: Data received from API: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.status.code === 'SUCCESS' && data.result.total_records > 0) {
      res(null, data.result.records);
    } else {
      res('Snapshot API Server Details: No Data received');
    }
  });

  ssListReq.on('requestTimeout', function (reqAPI) {
    logger.info('Snapshot API Server Details: Request has expired - Request: ' + util.inspect(reqAPI, {showHidden: false, depth: null}));
    reqAPI.abort();
    res('Snapshot API Server Details: Request Timeout');
  });

  ssListReq.on('responseTimeout', function (resAPI) {
    logger.info('Snapshot API Server Details: Response has expired - Response: ' + util.inspect(resAPI, {showHidden: false, depth: null}));
    res('Snapshot API Server Details: Response Timeout');
  });

  ssListReq.on('error', function (errAPI) {
    logger.info('Snapshot API Server Details: Something went wrong on the request: ', + errAPI.code);
    res('Snapshot API Server Details: Error');
  });
};

exports.ssVolumeDetailsExec = function (req, res) {

  var serverKey = req.serverKey;
  var volumeName = req.storagegroup;
  var volumeDetailsAPIRequestURL = config.APIservice.volumeDetails + '?storage_vm_key=' + serverKey + '&name=' + volumeName;
  logger.info("Server Details API Volume Request URL : " + volumeDetailsAPIRequestURL);

  var ssListReq = client.get(volumeDetailsAPIRequestURL, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }
    logger.info('Snapshot API volume details: Data received from API: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.status.code === 'SUCCESS' && data.result.total_records > 0) {
      res(null, data.result.records);
    } else {
      res('Snapshot API Volume Details: No Data received');
    }
  });

  ssListReq.on('requestTimeout', function (reqAPI) {
    logger.info('Snapshot API Volume Details: Request has expired - Request: ' + util.inspect(reqAPI, {showHidden: false, depth: null}));
    reqAPI.abort();
    res('Snapshot API Volume Details: Request Timeout');
  });

  ssListReq.on('responseTimeout', function (resAPI) {
    logger.info('Snapshot API Volume Details: Response has expired - Response: ' + util.inspect(resAPI, {showHidden: false, depth: null}));
    res('Snapshot API Volume Details: Response Timeout');
  });

  ssListReq.on('error', function (errAPI) {
    logger.info('Snapshot API Volume Details: Something went wrong on the request: ', + errAPI.code);
    res('Snapshot API Volume Details: Error');
  });
};

exports.ssListExec = function (req, res) {

  var volumeKey = req.volumeKey;
  var ssListAPIRequestURL = config.APIservice.snapshotBaseUrl + '?volume_key=' + volumeKey;
  if (req.snapshotCode) {
    ssListAPIRequestURL += '&name=' + req.snapshotCode;
  }
  logger.info("Server Details API List Snapshots Request URL : " + ssListAPIRequestURL);

  var ssListReq = client.get(ssListAPIRequestURL, function (data) {
    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }
    logger.info('Snapshot API snapshot list: Data received from API: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.status.code === 'SUCCESS' && data.result.total_records > 0) {
      res(null, data.result.records);
    } else {
      res('Snapshot API snapshot list: No Data received');
    }
  });

  ssListReq.on('requestTimeout', function (reqAPI) {
    logger.info('Snapshot API snapshot list: Request has expired - Request: ' + util.inspect(reqAPI, {showHidden: false, depth: null}));
    reqAPI.abort();
    res('Snapshot API snapshot list: Request Timeout');
  });

  ssListReq.on('responseTimeout', function (resAPI) {
    logger.info('Snapshot API snapshot list: Response has expired - Response: ' + util.inspect(resAPI, {showHidden: false, depth: null}));
    res('Snapshot API snapshot list: Response Timeout');
  });

  ssListReq.on('error', function (errAPI) {
    logger.info('Snapshot API snapshot list: Something went wrong on the request: ', + errAPI.code);
    res('Snapshot API snapshot list: Error');
  });
};
