'use strict';

var mysql = require('mysql2'),
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config'));

//To be enabled in case of Event Emitter error (However ConnectionPool fixes the issue for Event Emitter)
//Keeping this until all works well
//require('events').EventEmitter.defaultMaxListeners = Infinity;

var connectionPool = mysql.createPool(config.wfa.sql);

exports.sgRead = function (req, res) {
  var args = 'SELECT ' +
      'lunmap.lun_map_value AS \'lun_map_value\' ' +
    'FROM ' +
      'vserver, ' +
      'volume, ' +
      'lun, ' +
      'lunmap ' +
    'WHERE ' +
      'lunmap.lun_id = lun.id ' +
      'AND lun.name =  ? ' +
      'AND lun.volume_id = volume.id ' +
      'AND volume.name = ? '+
      'AND lun.vserver_id = vserver.id ' +
      'AND vserver.name = ? "';

  logger.info('StorageUnit MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
  connectionPool.getConnection(function(err, connection) {
    if (err) {
      logger.error('StorageUnit MySQL Read: Connection Error: ' + err);
      //On error send empty output
      res(null, sgOut);
    } else {
      connection.query(args, [req.code + '.lun', req.storagegroup, req.server], function (err, result) {
        logger.info('StorageUnit MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          logger.info('StorageUnit MySQL Read: Error: ' + err);
        } else if (result.length > 0) {
          sgOut.lunid = result[0].lun_map_value;
        }
        res(null, sgOut);
        connection.release();
      });
    }
  });
};

exports.getIgroups = function (req, res) {
  var sgOut = [];

  var args = 'SELECT igroup.name as igroup, cluster.name, vserver.name ' +
    'FROM ' +
      'netapp_model.igroup ' +
      'LEFT ' +
      'JOIN  ' +
      'netapp_model.cluster  ON netapp_model.cluster.objid = netapp_model.igroup.clusterId ' +
      'LEFT ' +
      'JOIN  ' +
      'netapp_model.vserver  ON netapp_model.vserver.objid = netapp_model.igroup.vserverId ' +
    'WHERE ' +
      'netapp_model.vserver.name = ? ' +
      'AND netapp_model.cluster.name = ? ' ;

  logger.info('StorageUnit MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
  connectionPool.getConnection(function(err, connection) {
    connection.release();
    if (err) {
      logger.error('StorageUnit MySQL Read: Connection Error: ' + err);
      //On error send empty output
      return res(null, sgOut);
    } else {
      connection.query(args, [req.vserverName, req.clusterName], function (err, result) {
        logger.info('StorageUnit MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          logger.info('StorageUnit MySQL Read: Error: ' + err);
        } else if (result.length > 0) {
          result.forEach(row => {
            sgOut.push(row.igroup)
          });
        }
        return res(null, sgOut);       
      });
    }
  });
}
