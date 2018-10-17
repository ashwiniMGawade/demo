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

exports.ssCreateExec = function (req, res) {

  var args = {};
  args.data = {
    volume_key : req.volumeKey,
    storage_vm_key: req.serverKey,
    name: req.snapshot
  };

  logger.info('Snapshot API Create: Args: ' + util.inspect(args, {showHidden: false, depth: null}));

  var ssCreateReq = client.post(config.APIservice.snapshotBaseUrl, args, function (data) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }
    logger.info('Snapshot API Create: Data received from API: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.status.code === 'FAILED') {
      res(data.status.error.message);
    } else {
      res(null, data);
    }
  });

  ssCreateReq.on('requestTimeout', function (reqAPI) {
    logger.info('Snapshot API Create: Request has expired - Request: ' + util.inspect(reqAPI, {showHidden: false, depth: null}));
    reqAPI.abort();
    res('Snapshot API Create: Request Timeout');
  });

  ssCreateReq.on('responseTimeout', function (resAPI) {
    logger.info('Snapshot API Create: Response has expired - Response: ' + util.inspect(resAPI, {showHidden: false, depth: null}));
    res('Snapshot API Create: Response Timeout');
  });

  ssCreateReq.on('error', function (errAPI) {
    logger.info('Snapshot API Create: Something went wrong on the request: ', + errAPI.code);
    res('Snapshot API Create: Error');
  });
};
