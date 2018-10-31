'use strict';

var mysql = require('mysql2'),
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config'));

//To be enabled in case of Event Emitter error (However ConnectionPool fixes the issue for Event Emitter)
//Keeping this until all works well (to be removed when Event Emitter error does not reoccur)
//require('events').EventEmitter.defaultMaxListeners = Infinity;


var connectionPool = mysql.createPool(config.wfa.sql);

// exports.getAdminVserver = function (siteCode, subscriptionCode, res) {

//   logger.error('Server getAdminVserver(): MySQL Read: Retrieving Admin Vserver for siteCode: \"' + siteCode + '\" and subscriptionCode \"' + subscriptionCode + '\".');

//   var adminVserver = {
//     siteCode: '',
//     podCode: '',
//     state: '',
//     clusterName: ''
//   };

//   // I found that this query and code assumes the first row returned from WFA is always
//   // the correct pod. That's (sort of) okay if a site ONLY has one pod, but it will break
//   // once two or more pods are configured for a site. The subscriptionCode will need to 
//   // be considered to distinguish which pod to select. Furthermore, this query could still
//   // possibly return a pod with two or more clusters for that pod, but only uses the first
//   // result. NEEDS FIXING. JL - 9 Mar 2018

//   var args = ' SELECT ' +
//     'LOWER(SUBSTRING_INDEX(vserver.comment, "_", 1)) AS "siteCode", ' +
//     'LOWER(SUBSTRING_INDEX(SUBSTRING_INDEX(vserver.comment, "_", 2), "_", -1)) AS "podCode", ' +
//     'LOWER(SUBSTRING_INDEX(SUBSTRING_INDEX(vserver.comment, "_", 3),"_",-1)) AS "state", ' +
//     'cluster.name AS "clusterName" ' +
//     'FROM cluster, vserver ' +
//     'WHERE ' +
//         'lower(?) = lower(SUBSTRING_INDEX(vserver.comment, "_", 1)) ' +
//         'AND lower(SUBSTRING_INDEX(SUBSTRING_INDEX(vserver.comment, "_", 3),"_",-1)) = "open" '+
//        // 'AND lower("' + subscriptionCode + '") in (SUBSTRING_INDEX(SUBSTRING_INDEX(vserver.comment, "_", 4), "_", -1)) '+
//         'AND vserver.name = CONCAT(cluster.name, "_admin") ' +       
//         'AND vserver.cluster_id = cluster.id';

//   logger.info('Server getAdminVserver(): MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

//   connectionPool.getConnection(function(err, connection) {
//     if(err){
//       logger.error('Server getAdminVserver(): MySQL Read: Connection Error: ' + err);
//       res(err, adminVserver);
//     }else{
//       connection.query(args, [siteCode], function (err, result) {
//         logger.info('Server getAdminVserver(): MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
//         if (err) {
//           logger.info('Server getAdminVserver(): MySQL Read: Error: ' + err);
//           res(err, adminVserver);
//         } else if (result.length > 0) {
//           adminVserver.siteCode = result[0].siteCode;
//           adminVserver.podCode = result[0].podCode;
//           adminVserver.state = result[0].state;
//           adminVserver.clusterName = result[0].clusterName;
//           res(null, adminVserver);
//         } else {
//           logger.info('Server getAdminVserver(): MySQL Read: No Records found');
//           res("Server Read: No records found", adminVserver);
//         }
//         connection.release();
//       });
//     }
//   });
// };

// exports.svmRead = function (req, res) {

//   var svmOut = {
//     volumesName: '',
//     volumesUsed: '',
//     volumesCapacity: '',
//     volumesTier: '',
//     iopsTotal: ''
//   };

//   var args = 'SELECT ' +
//       'cluster.primary_address AS cluster_primary_address, ' +
//       'vserver.name AS name, ' +
//       'GROUP_CONCAT(volume.name) AS volumes_name, ' +
//       'GROUP_CONCAT(volume.used_size_mb) AS volumes_used, ' +
//       'GROUP_CONCAT(volume.size_mb) AS volumes_size, ' +
//       'GROUP_CONCAT(aggregate.name) AS volumes_aggregate, ' +
//       '( ' +
//         'SELECT ' +
//           'GROUP_CONCAT(qos_policy_group.max_throughput_limit) ' +
//         'FROM ' +
//           'cm_storage.qos_policy_group qos_policy_group ' +
//         'WHERE ' +
//           'qos_policy_group.vserver_id = vserver.id ' +
//         'GROUP BY ' +
//           'vserver.id ' +
//       ') AS qos_policy_groups_max_throughput_limit ' +
//     'FROM ' +
//       'cm_storage.vserver vserver ' +
//       'JOIN ' +
//         'cm_storage.cluster cluster ' +
//           'ON vserver.cluster_id = cluster.id ' +
//       'JOIN ' +
//         'cm_storage.volume volume ' +
//           'ON volume.vserver_id = vserver.id ' +
//       'JOIN ' +
//         'cm_storage.aggregate aggregate ' +
//           'ON volume.aggregate_id = aggregate.id ' +
//     'WHERE ' +
//       'volume.name NOT LIKE CONCAT(vserver.name,"_root") ' +
//       'AND vserver.name LIKE ? ' +
//     'GROUP BY ' +
//       'vserver.id';

//   logger.info('Server svmRead(): MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

//   connectionPool.getConnection(function(err, connection) {
//     if(err){
//       logger.error('Server svmRead(): MySQL Read: Connection Error: ' + err);
//       //On error send empty output
//       res(null, svmOut);
//     }else{
//       connection.query( args, [req], function(err, result) {
//         if (err) {
//           logger.info('Server svmRead(): MySQL Read: Error: ' + err);
//         } else if (result.length > 0) {
//           svmOut.volumesName = result[0].volumes_name;
//           svmOut.volumesUsed = result[0].volumes_used;
//           svmOut.volumesCapacity = result[0].volumes_size;
//           svmOut.volumesTier = result[0].volumes_aggregate;
//           svmOut.iopsTotal = result[0].qos_policy_groups_max_throughput_limit;
//         }
//         res(null, svmOut);
//         connection.release();
//       });
//     }
//   });
// };

exports.getUUIDs = function(serverCode, clusterName, res) {
  logger.error('Server getUUIDs: MySQL Read: Retrieving Admin Vserver for vserver_uuid, cluster_uuid, storage_vm_key: \"' + serverCode + '\" and subscriptionCode \"' + clusterName + '\".');

  var adminVserver = {
    ontap_cluster_uuid : '',
    ontap_vserver_uuid : '',
    apis_storage_vm_key  : ''
  };


  var args = ' SELECT ' +
    'vserver.uuid as "vserver_uuid", ' +
    'cluster.uuid as "cluster_uuid", ' +
    'concat(cluster.uuid,":type=vserver,uuid=",vserver.uuid) as "storage_vm_key" ' +
    'FROM vserver , cluster ' +
    'WHERE ' +
        'vserver.cluster_id = cluster.id ' +
        'AND vserver.name = ? ' +       
        'AND ( ' + 
        ' cluster.primary_address = ? or  cluster.name = ?)';

  logger.info('Server getUUIDs(): MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
  logger.info("query params for sql:");
  logger.info( [serverCode, clusterName, clusterName]);

  connectionPool.getConnection(function(err, connection) {
    if(err){
      logger.error('Server getUUIDs(): MySQL Read: Connection Error: ' + err);
      res(err, adminVserver);
    }else{
      connection.query(args, [serverCode, clusterName, clusterName], function (err, result) {
        logger.info("sql query = " + this.sql);
        logger.info('Server getUUIDs(): MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          logger.info('Server getUUIDs(): MySQL Read: Error: ' + err);
          res(err, adminVserver);
        } else if (result.length > 0) {
          adminVserver.ontap_cluster_uuid = result[0].cluster_uuid;
          adminVserver.ontap_vserver_uuid = result[0].vserver_uuid;
          adminVserver.apis_storage_vm_key = result[0].storage_vm_key;
          res(null, adminVserver);
        } else {
          res(null, false);
        }
        connection.release();
      });
    }
  });
}
