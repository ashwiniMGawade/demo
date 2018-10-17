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

  var sgOut = {
    usedSize: '',
    allocatedSize: '',
    snapshotSize: '',
    volumeSize: ''
  };
  var args = 'SELECT ' +
      'volume.name AS \'name\', ' +
      'vserver.name AS \'vserver.name\', ' +
      'cluster.primary_address AS \'vserver.cluster.primary_address\', ' +
      'CONVERT(COALESCE(SUM(qtree.disk_limit_mb), 0) + COALESCE(SUM(lun.size_mb), 0), SIGNED) AS \'presented_size_mb\', ' +
      '(volume.used_size_mb + volume.compression_space_saved_mb + volume.deduplication_space_saved_mb) AS \'used_size_mb\', ' +
      'volume.snapshot_used_mb AS \'snapshot_size_mb\', ' +
      'volume.size_mb AS \'volume_size_mb\', ' +
      'SUBSTRING_INDEX(aggregate.name, \'_\', -1) AS \'tier\' ' +
    'FROM ' +
      'cluster, ' +
      'vserver, ' +
      'aggregate, ' +
      'volume ' +
    'LEFT JOIN ' +
      'qtree ' +
        'ON qtree.volume_id = volume.id ' +
    'LEFT JOIN ' +
      'lun ' +
        'ON lun.volume_id = volume.id ' +
    'WHERE ' +
      'vserver.id = volume.vserver_id ' +
      'AND aggregate.id = volume.aggregate_id ' +
      'AND cluster.id = vserver.cluster_id ' +
      'AND volume.name = ? ' +
      'AND vserver.name = ? ';

  logger.info('StorageGroup MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
  connectionPool.getConnection(function(err, connection) {
    if(err){
      logger.error('StorageGroup MySQL Read: Connection Error: ' + err);
      //On error send empty output
      res(null, sgOut);
    }else{
      connection.query(args, [req.code, req.server.code],  function (err, result) {
        logger.info('StorageGroup MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          logger.info('StorageGroup MySQL Read: Error: ' + err);
        } else if (result.length > 0) {
          sgOut.presentedSize = result[0].presented_size_mb;
          sgOut.usedSize = result[0].used_size_mb;
          sgOut.snapshotSize = result[0].snapshot_size_mb;
          sgOut.volumeSize = result[0].volume_size_mb;
        }
        res(null, sgOut);
        connection.release();
      });
    }
  });
};
