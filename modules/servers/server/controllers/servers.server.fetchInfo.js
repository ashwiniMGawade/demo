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
    clusterName: '',
    clusterId: ''
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
                adminVserver.clusterId = cluster._id;
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
