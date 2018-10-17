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

exports.ssDeleteExec = function (req, res) {

  var snapshotKey = req.snapshotKey;
  var ssDeleteReq = client.delete(config.APIservice.snapshotBaseUrl+ '/' + snapshotKey, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }
    logger.info('Snapshot API snapshot Delete: Data received from API: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.status.code === 'FAILED') {
      res(data.status.error.message);
    } else {
      res(null, data);
    }
  });

  ssDeleteReq.on('requestTimeout', function (reqAPI) {
    logger.info('Snapshot API snapshot Delete: Request has expired - Request: ' + util.inspect(reqAPI, {showHidden: false, depth: null}));
    reqAPI.abort();
    res('Snapshot API snapshot Delete: Request Timeout');
  });

  ssDeleteReq.on('responseTimeout', function (resAPI) {
    logger.info('Snapshot API snapshot Delete: Response has expired - Response: ' + util.inspect(resAPI, {showHidden: false, depth: null}));
    res('Snapshot API snapshot Delete: Response Timeout');
  });

  ssDeleteReq.on('error', function (errAPI) {
    logger.info('Snapshot API Server Delete: Something went wrong on the request: ' + errAPI.code);
    res('Snapshot API snapshot Delete: Error');
  });
};
