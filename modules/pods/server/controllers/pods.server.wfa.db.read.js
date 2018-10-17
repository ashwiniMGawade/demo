'use strict';

var mysql = require('mysql2'),
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config'));

var connectionPool = mysql.createPool(config.wfa.sql);

exports.vlansUsedRead = function (siteCode, podCode, cb) {

  // Retrieve all VLANs already configured on all clusters within a pod at a site,
  // from WFA MySQL DB. Use siteCode and podCode as args for the query. Return an
  // array of VLAN IDs. If no VLANs are found, return an empty array.
  // JL - 8 Mar 2018

  var vlansUsed = []; 

  var query = ' SELECT DISTINCT port.vlan_id as "port_vlan_id" ' +
    'FROM cm_storage.cluster, cm_storage.node, cm_storage.port, cm_storage.vserver ' +
    'WHERE ' +
    'cluster.id = node.cluster_id ' +
    'AND node.id = port.node_id ' +
    'AND port.type = "vlan" ' +
    'AND cluster.id = vserver.cluster_id ' +
    'AND vserver.name = CONCAT(cluster.name, "_admin") ' +
    'AND SUBSTRING_INDEX(vserver.comment, "_", 2) = CONCAT(?, "_", ?) ' +
    'ORDER BY port.vlan_id ASC ';

  logger.info('Pod vlansUsedRead(): Retrieving used VLANs for siteCode=\"' + siteCode + '\", podCode=\"' + podCode + '\"...');
  logger.info('Pod vlansUsedRead(): MySQL query: ' + util.inspect(query, {showHidden: false, depth: null}));

  connectionPool.getConnection(function(err, connection) {
    if(err){
      logger.error('Pod vlansUsedRead(): Failed to get a MySQL connection: ' + err);
      cb(err, vlansUsed);
    } else {
      // Execute query.
      connection.query(query, [siteCode, podCode], function(err, results, fields) {
        if(err) {
          logger.error('Pod vlansUsedRead(): MySQL error encountered during query: ' + err);
          cb(err, vlansUsed);
        } else {

          logger.info('Pod vlansUsedRead(): MySQL query succeeded. ' + results.length + ' results: ' + util.inspect(results, {showHidden: false, depth: null}));

          if(results.length > 0) {

            // Assign returned VLANs to vlansUsed array.
            for(var i in results) {
              vlansUsed.push(results[i].port_vlan_id);
            }

            logger.info('Pod vlansUsedRead(): vlansUsed: ' + util.inspect(vlansUsed, {showHidden: false, depth: null}));
            cb(null, vlansUsed);

          } else {
            logger.info('Pod vlansUsedRead(): MySQL Read: No Records found');
            cb("Pod vlansUsedRead(): No records returned from MySQL.", vlansUsed);
          }
          connection.release();
        }
      });
    }
  });
};
