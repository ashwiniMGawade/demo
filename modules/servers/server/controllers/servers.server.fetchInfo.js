'use strict';

var  _ = require('lodash'),
    path = require('path'),
    util = require('util'),
    logger = require(path.resolve('./config/lib/log')),
    config = require(path.resolve('./config/config')),
    mongoose = require('mongoose'),
    Server = mongoose.model('Server'),
    Pod = mongoose.model('Pod'),
    Cluster = mongoose.model('ontap_clusters'),
    Subscription = mongoose.model('Subscription');

//To be enabled in case of Event Emitter error (However ConnectionPool fixes the issue for Event Emitter)
//Keeping this until all works well (to be removed when Event Emitter error does not reoccur)
//require('events').EventEmitter.defaultMaxListeners = Infinity;

exports.getAdminVserver = function (siteId, siteCode, subscriptionCode, res) {

  logger.error('Server getAdminVserver(): MySQL Read: Retrieving Admin Vserver for siteCode: \"' + siteId + '\" and subscriptionCode \"' + subscriptionCode + '\".');

  var adminVserver = {
    siteCode: '',
    podCode: '',
    state: '',
    clusterName: ''
  };

  //get all pods present for selected site

  var podFound = false;

  Pod.find({site: mongoose.Types.ObjectId(siteId)})
  .populate('cluster_keys', 'name key provisioning_state')
  .exec(function (err, pods) {
    if (err) {
      console.log(err);
      logger.error('SVM Create: Failed to retrieve Pods related to site from Mongo - Site id: \"' + siteId + '\".');
      res('Failed to retrieve Pods related to site from Mongo - Site id: \"' + siteId + '\".', adminVserver);
    } else {
       _.forEach(pods, function(value, key) {
          if (value.cluster_keys && value.cluster_keys.length > 0){
            _.forEach(value.cluster_keys, function(cluster) {
              if (cluster.provisioning_state == 'open') {
                adminVserver.clusterName = cluster.name;
                adminVserver.state = cluster.provisioning_state;
                adminVserver.siteCode = siteCode;
                adminVserver.podCode = value.code;
                podFound = true;
                res(null, adminVserver);
              }
            });            
          }
        });

      if(!podFound) res("can not find pod", adminVserver);
    }
  });  
};

exports.svmRead = function (req, res) {

  var svmOut = {
    volumesName: '',
    volumesUsed: '',
    volumesCapacity: '',
    volumesTier: '',
    iopsTotal: ''
  };

  var args = 'SELECT ' +
      'cluster.primary_address AS cluster_primary_address, ' +
      'vserver.name AS name, ' +
      'GROUP_CONCAT(volume.name) AS volumes_name, ' +
      'GROUP_CONCAT(volume.used_size_mb) AS volumes_used, ' +
      'GROUP_CONCAT(volume.size_mb) AS volumes_size, ' +
      'GROUP_CONCAT(aggregate.name) AS volumes_aggregate, ' +
      '( ' +
        'SELECT ' +
          'GROUP_CONCAT(qos_policy_group.max_throughput_limit) ' +
        'FROM ' +
          'cm_storage.qos_policy_group qos_policy_group ' +
        'WHERE ' +
          'qos_policy_group.vserver_id = vserver.id ' +
        'GROUP BY ' +
          'vserver.id ' +
      ') AS qos_policy_groups_max_throughput_limit ' +
    'FROM ' +
      'cm_storage.vserver vserver ' +
      'JOIN ' +
        'cm_storage.cluster cluster ' +
          'ON vserver.cluster_id = cluster.id ' +
      'JOIN ' +
        'cm_storage.volume volume ' +
          'ON volume.vserver_id = vserver.id ' +
      'JOIN ' +
        'cm_storage.aggregate aggregate ' +
          'ON volume.aggregate_id = aggregate.id ' +
    'WHERE ' +
      'volume.name NOT LIKE CONCAT(vserver.name,"_root") ' +
      'AND vserver.name LIKE ? ' +
    'GROUP BY ' +
      'vserver.id';

  logger.info('Server svmRead(): MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

  connectionPool.getConnection(function(err, connection) {
    if(err){
      logger.error('Server svmRead(): MySQL Read: Connection Error: ' + err);
      //On error send empty output
      res(null, svmOut);
    }else{
      connection.query( args, [req], function(err, result) {
        if (err) {
          logger.info('Server svmRead(): MySQL Read: Error: ' + err);
        } else if (result.length > 0) {
          svmOut.volumesName = result[0].volumes_name;
          svmOut.volumesUsed = result[0].volumes_used;
          svmOut.volumesCapacity = result[0].volumes_size;
          svmOut.volumesTier = result[0].volumes_aggregate;
          svmOut.iopsTotal = result[0].qos_policy_groups_max_throughput_limit;
        }
        res(null, svmOut);
        connection.release();
      });
    }
  });
};
