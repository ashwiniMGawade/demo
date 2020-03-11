'use strict';

const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 900, checkperiod: 500 } );

var mysql = require('mysql2'),
    path = require('path'),
    util = require('util'),
    mongoose = require('mongoose'),
    Server = mongoose.model('Server'),
    Tenant = mongoose.model('Tenant'),
    logger = require(path.resolve('./config/lib/log')),
    _ = require('lodash'),
    config = require(path.resolve('./config/config'));

//To be enabled in case of Event Emitter error (However ConnectionPool fixes the issue for Event Emitter)
//Keeping this until all works well (to be removed when Event Emitter error does not reoccur)
//require('events').EventEmitter.defaultMaxListeners = Infinity;

var connectionPool = mysql.createPool(config.wfa.sql);

var formatResult = function(results, callback) {
  var showGraphs = false;
  for (var i in results) {
    if (results[i].num_non_root_volumes > 0) {
      showGraphs = true;      
      logger.info(results[i].num_non_root_volumes + " : " + showGraphs)
    }
  }
  logger.info(showGraphs);
  return callback(null, showGraphs);
};

var getQueryResults = function(svms, callback) {

    //svms = ["aff_admin", "c1_svm_mel", "c2_svm_mel", "c3_svm_AFF", "dfaas_tls_def_002", "dfaas_jl_def_002"];

    //svms = ["dfaas_tls_def_002"];

    if (!svms.length) {
      return callback("No svms present");
    }

    var svmString = '';

    _.forEach(svms, function(svm, index) {
      svmString += '"' + svm +'"';
      if (index < svms.length -1) {
         svmString += ',';
      }
    });
    var args = 'SELECT ' +
      'vs.name vserver_name, ' +
      'count(s1.volume_id) num_non_root_volumes ' +
      'FROM cm_storage.cluster c ' +
      'JOIN cm_storage.vserver vs ' +
      'ON c.id = vs.cluster_id ' + 
      'LEFT JOIN ' +
      '(SELECT '+ 
           'c.id cluster_id, ' +
           'vs.id vserver_id, ' +
           'vol.id volume_id, '+
           'vol.name volume_name ' +
      'FROM cm_storage.cluster c ' +
      'JOIN cm_storage.vserver vs ON c.id = vs.cluster_id ' +
      'JOIN cm_storage.volume vol ON vs.id = vol.vserver_id ' +
      'WHERE ' +
           'vs.root_volume_id != vol.id) AS s1 ' +
    'ON c.id = s1.cluster_id AND vs.id = s1.vserver_id ' +
    'WHERE ' + 
      'vs.type = "data" '+ 
      'AND vs.admin_state = "running" '+ 
      'AND vs.name IN (' + svmString + ') ' +
    'GROUP BY c.id, vs.id '+ 
    'ORDER BY c.id, vs.id ';
  
  logger.info('Server AC DB MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

  connectionPool.getConnection(function(err, connection) {
    logger.info(err);
    logger.info(connection);
    if (err) {
      logger.error('SVM AC DB MySQL Read: Connection Error: ' + err);
      return callback(err);
    } else {
      connection.query(args, function (err, result) {
        logger.info('SVM AC DB Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          logger.info('SVM AC DB Read: Error: ' + err);
          return callback(err);
        } else if (result.length > 0) {
          formatResult(result, callback);
        } else {
          logger.info('SVM AC DB Read: No Records found');
          return callback(err);
        }
        connection.release();
      });
    }
  });
};

exports.acRead = function (tenant, server, sg, callback) {
  var svms = [];
  if (tenant) {
    var query = Server.find();
    query.where({'tenant': tenant._id});    
    query.exec(function (err, servers) {
      if (servers && servers.length > 0) {
        _.forEach(servers, function(server){
          if (server.status === 'Operational' && server.code) {
            svms.push(server.code);           
          }          
        });        
     }
     getQueryResults(svms, callback);     
    });
  }
  if (server) {
    svms.push(server.code);
    getQueryResults(svms, callback);
  }

  if (sg) {
    svms.push(sg.server.code);
    getQueryResults(svms, callback);
  }  
};

exports.clusterRead = function (callback) {
  /*
   SELECT cluster.name AS 'cluster_name', cluster.diagnosisStatus AS 'system_health',
   if(((unix_timestamp(now()) * 1000)-cluster.lastUpdateTime)<=900000, 'Good','Bad') AS 'communicaion',
   substring_index(substring(cluster.version,16,10),':',1) As 'os_version',
   if(cluster.haConfigured,'true','false') AS 'ha_configured',
   count(netapp_model.node.name) AS 'Node Count'
    FROM netapp_model.cluster
    LEFT JOIN netapp_model.node ON netapp_model.node.clusterId = netapp_model.cluster.objid
    GROUP BY cluster.name;
  */
    var value = myCache.get("clusters")
    if(value == undefined){
      console.log("inside the cache not found. getting from db")
      var args = 'SELECT ' +
        'cluster.name AS \'cluster_name\', ' +
        'cluster.diagnosisStatus AS \'system_health\', ' +
        'if(((unix_timestamp(now()) * 1000)-cluster.lastUpdateTime)<=900000, \'Good\',\'Bad\') AS \'communicaion\', ' +
        'substring_index(substring(cluster.version,16,10),\':\',1) As \'os_version\', ' +
        'if(cluster.haConfigured,\'true\',\'false\') AS \'ha_configured\', ' +
        ' count(netapp_model.node.name) AS \'node_count\' ' +
      'FROM ' +
        'netapp_model.cluster ' +
        'LEFT JOIN ' +
        'netapp_model.node ' +
          'ON netapp_model.node.clusterId = netapp_model.cluster.objid ' +
          'GROUP BY cluster.name';

      logger.info('Cluster health MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
      connectionPool.getConnection(function(err, connection) {
        if(err){
          logger.error('Cluster health MySQL Read: Connection Error: ' + err);
          //On error send empty output
          callback(err, [])
        }else{
          connection.query(args, function (err, result) {
            logger.info('Cluster health MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
            if (err) {
              logger.info('Cluster health MySQL Read: Error: ' + err);
            } else if (result.length > 0) {
              myCache.set( "clusters", result, 100 );  
              callback(null, result);
            }
            callback(null, []);
            connection.release();
          });
        }
      });
    } else {
      logger.info("Loading from cache clusters");
      //  logger.info(util.inspect(value, {showHidden: false, depth: null}));
      callback(null, value);
    }
};

exports.nodeRead = function (callback) {

  var value = myCache.get("nodes")
    if(value == undefined){
      console.log("inside the cache not found. getting from db")
  /*
   SELECT cluster.name AS 'cluster_name', node.name AS 'node_name', node.model AS 'node_model',
       substring_index(substring(node.version,16,10),':',1) As 'os_version',
       if(node.isNodeHealthy,'Yes','No') AS 'node_healthy', if(node.isInterconnectUp,'Yes','No') AS 'HA Status',
       if(node.isFailoverEnabled,'Yes','No') AS 'Failover Enabled', if(node.isTakeOverPossible,'Yes','No') AS 'TakeOver Possible',
       substring(node.interconnectLinks,22,2) AS 'RMDA Connection',
       if(node.isAllFlashOptimized,'Yes',if(substring(node.model,1,3)='FAS','NA','No')) AS 'Flash Optimized',
       CONCAT(FLOOR(HOUR(SEC_TO_TIME(node.uptime)) / 24), ' days ', MOD(HOUR(SEC_TO_TIME(node.uptime)), 24), ' Hrs ', MINUTE (SEC_TO_TIME(node.uptime)), ' Mins ', second(SEC_TO_TIME(node.uptime)), ' Secs') As 'Up Time',
       if((node.aggregateBytesTotal) <= 1024,concat(node.aggregateBytesTotal,' B'),
       if((node.aggregateBytesTotal/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024,2),' KB'),
       if((node.aggregateBytesTotal/1024/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024/1024,2),' MB'),
       if((node.aggregateBytesTotal/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024/1024/1024,2),' GB'),
       if((node.aggregateBytesTotal/1024/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024/1024/1024/1024,2),' TB'),
       concat(round(aggregateBytesTotal/1024/1024/1024/1024/1024,2),' PB')))))) AS 'Aggregate Total Capacity',
       if((node.aggregateBytesUsed) <= 1024,concat(node.aggregateBytesUsed,' B'),
       if((node.aggregateBytesUsed/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024),' KB'),
       if((node.aggregateBytesUsed/1024/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024/1024,2),' MB'),
       if((node.aggregateBytesUsed/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024/1024/1024,2),' GB'),
       if((node.aggregateBytesUsed/1024/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024/1024/1024/1024,2),' TB'),
       concat(round(node.aggregateBytesUsed/1024/1024/1024/1024/1024,2),' PB')))))) AS 'Aggregate Used Capacity',
       if((node.rawDiskBytesTotal) <= 1024,concat(node.rawDiskBytesTotal,' B'),
       if((node.rawDiskBytesTotal/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024,2),' KB'),
       if((node.rawDiskBytesTotal/1024/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024/1024,2),' MB'),
       if((node.rawDiskBytesTotal/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024/1024/1024,2),' GB'),
       if((node.rawDiskBytesTotal/1024/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024/1024/1024/1024,2),' TB'),
       concat(round(node.rawDiskBytesTotal/1024/1024/1024/1024/1024,2),' PB')))))) AS 'Total Raw Capacity',
       if((node.rawDiskBytesUsed) <= 1024,concat(node.rawDiskBytesUsed,' B'),
       if((node.rawDiskBytesUsed/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024,2),' KB'),
       if((node.rawDiskBytesUsed/1024/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024/1024,2),' MB'),
       if((node.rawDiskBytesUsed/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024/1024/1024,2),' GB'),
       if((node.rawDiskBytesUsed/1024/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024/1024/1024/1024,2),' TB'),
       concat(round(node.rawDiskBytesUsed/1024/1024/1024/1024/1024,2),' PB')))))) AS 'Used Raw Capacity'
FROM netapp_model.node LEFT JOIN netapp_model.cluster ON netapp_model.node.clusterId = netapp_model.cluster.objid;
  */
    var args = "SELECT cluster.name AS 'cluster_name', node.name AS 'node_name', node.model AS 'node_model'," +
    "substring_index(substring(node.version,16,10),':',1) As 'os_version'," +
    "if(node.isNodeHealthy,'Yes','No') AS 'node_healthy', if(node.isInterconnectUp,'Yes','No') AS 'ha_status'," +
    "if(node.isFailoverEnabled,'Yes','No') AS 'failover_enabled', if(node.isTakeOverPossible,'Yes','No') AS 'takeover_possible'," +
    "substring(node.interconnectLinks,22,2) AS 'RMDA_connection'," +
    "if(node.isAllFlashOptimized,'Yes',if(substring(node.model,1,3)='FAS','NA','No')) AS 'flash_optimized'," +
    "CONCAT(FLOOR(HOUR(SEC_TO_TIME(node.uptime)) / 24), ' days ', MOD(HOUR(SEC_TO_TIME(node.uptime)), 24), ' Hrs ', MINUTE (SEC_TO_TIME(node.uptime)), ' Mins ', second(SEC_TO_TIME(node.uptime)), ' Secs') As 'up_time'" +
    // ", if((node.aggregateBytesTotal) <= 1024,concat(node.aggregateBytesTotal,' B')," +
    // "if((node.aggregateBytesTotal/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024,2),' KB')," +
    // "if((node.aggregateBytesTotal/1024/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024/1024,2),' MB')," +
    // "if((node.aggregateBytesTotal/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024/1024/1024,2),' GB')," +
    // "if((node.aggregateBytesTotal/1024/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesTotal/1024/1024/1024/1024,2),' TB')," +
    // "concat(round(aggregateBytesTotal/1024/1024/1024/1024/1024,2),' PB')))))) AS 'aggregate_total_capacity'," +
    // "if((node.aggregateBytesUsed) <= 1024,concat(node.aggregateBytesUsed,' B')," +
    // "if((node.aggregateBytesUsed/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024),' KB')," +
    // "if((node.aggregateBytesUsed/1024/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024/1024,2),' MB')," +
    // "if((node.aggregateBytesUsed/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024/1024/1024,2),' GB')," +
    // "if((node.aggregateBytesUsed/1024/1024/1024/1024) <= 1024,concat(round(node.aggregateBytesUsed/1024/1024/1024/1024,2),' TB')," +
    // "concat(round(node.aggregateBytesUsed/1024/1024/1024/1024/1024,2),' PB')))))) AS 'aggregate_used_capacity'," +
    // "if((node.rawDiskBytesTotal) <= 1024,concat(node.rawDiskBytesTotal,' B')," +
    // "if((node.rawDiskBytesTotal/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024,2),' KB')," +
    // "if((node.rawDiskBytesTotal/1024/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024/1024,2),' MB')," +
    // "if((node.rawDiskBytesTotal/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024/1024/1024,2),' GB')," +
    // "if((node.rawDiskBytesTotal/1024/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesTotal/1024/1024/1024/1024,2),' TB')," +
    // "concat(round(node.rawDiskBytesTotal/1024/1024/1024/1024/1024,2),' PB')))))) AS 'total_raw_capacity'," +
    // "if((node.rawDiskBytesUsed) <= 1024,concat(node.rawDiskBytesUsed,' B')," +
    // "if((node.rawDiskBytesUsed/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024,2),' KB')," +
    // "if((node.rawDiskBytesUsed/1024/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024/1024,2),' MB')," +
    // "if((node.rawDiskBytesUsed/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024/1024/1024,2),' GB')," +
    // "if((node.rawDiskBytesUsed/1024/1024/1024/1024) <= 1024,concat(round(node.rawDiskBytesUsed/1024/1024/1024/1024,2),' TB')," +
    // "concat(round(node.rawDiskBytesUsed/1024/1024/1024/1024/1024,2),' PB')))))) AS 'used_raw_capacity'" +
  "FROM netapp_model.node LEFT JOIN netapp_model.cluster ON netapp_model.node.clusterId = netapp_model.cluster.objid;";

    logger.info('Node health MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
    connectionPool.getConnection(function(err, connection) {
      if(err){
        logger.error('Node health MySQL Read: Connection Error: ' + err);
        //On error send empty output
        callback(err, [])
      }else{
        connection.query(args, function (err, result) {
          logger.info('Node health MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
          if (err) {
            logger.info('Node health MySQL Read: Error: ' + err);
          } else if (result.length > 0) {
            myCache.set( "nodes", result, 100 );  
            callback(null, result);
          }
          callback(null, []);
          connection.release();
        });
      }
    });
  } else {
    logger.info("Loading aggregates from cache");
    //  logger.info(util.inspect(value, {showHidden: false, depth: null}));
    callback(null, value);
  }
};

exports.aggregateRead = function (callback) {
  /*
  SELECT  aggregate.name AS 'aggregate_name', aggregate.stateRaw AS 'state', node.name AS 'node_name',
   aggregate.aggregateType AS 'type',
   if((aggregate.sizeAvail) <= 1024,concat(aggregate.sizeAvail,' B'),
   if((aggregate.sizeAvail/1024) <= 1024,concat(round(aggregate.sizeAvail/1024,2),' KB'),
   if((aggregate.sizeAvail/1024/1024) <= 1024,concat(round(aggregate.sizeAvail/1024/1024,2),' MB'),
   if((aggregate.sizeAvail/1024/1024/1024) <= 1024,concat(round(aggregate.sizeAvail/1024/1024/1024,2),' GB'),
   if((aggregate.sizeAvail/1024/1024/1024/1024) <= 1024,concat(round(aggregate.sizeAvail/1024/1024/1024/1024,2),' TB'),
   concat(round(aggregate.sizeAvail/1024/1024/1024/1024/1024,2),' PB')))))) AS 'available_data_capacity',
   if((aggregate.sizeTotal) <= 1024,concat(aggregate.sizeTotal,' B'),
   if((aggregate.sizeTotal/1024) <= 1024,concat(round(aggregate.sizeTotal/1024,2),' KB'),
   if((aggregate.sizeTotal/1024/1024) <= 1024,concat(round(aggregate.sizeTotal/1024/1024,2),' MB'),
   if((aggregate.sizeTotal/1024/1024/1024) <= 1024,concat(round(aggregate.sizeTotal/1024/1024/1024,2),' GB'),
   if((aggregate.sizeTotal/1024/1024/1024/1024) <= 1024,concat(round(aggregate.sizeTotal/1024/1024/1024/1024,2),' TB'),
   concat(round(aggregate.sizeTotal/1024/1024/1024/1024/1024,2),' PB')))))) AS 'total_data_capacity',
   if((aggregate.totalCommitted) <= 1024,concat(aggregate.totalCommitted,' B'),
   if((aggregate.totalCommitted/1024) <= 1024,concat(round(aggregate.totalCommitted/1024,2),' KB'),
   if((aggregate.totalCommitted/1024/1024) <= 1024,concat(round(aggregate.totalCommitted/1024/1024,2),' MB'),
   if((aggregate.totalCommitted/1024/1024/1024) <= 1024,concat(round(aggregate.totalCommitted/1024/1024/1024,2),' GB'),
   if((aggregate.totalCommitted/1024/1024/1024/1024) <= 1024,concat(round(aggregate.totalCommitted/1024/1024/1024/1024,2),' TB'),
   concat(round(aggregate.totalCommitted/1024/1024/1024/1024/1024,2),' PB')))))) AS 'committed_capacity'
FROM netapp_model.aggregate
LEFT JOIN netapp_model.node ON netapp_model.aggregate.nodeId = netapp_model.node.objid
WHERE netapp_model.aggregate.isRootAggregate=0;
  */
  var value = myCache.get("aggregates")
  if(value == undefined){
    console.log("inside the cache not found. getting from db")
    var args ="SELECT  aggregate.name AS 'aggregate_name', aggregate.stateRaw AS 'state', node.name AS 'node_name', " +
      "aggregate.aggregateType AS 'type'," +
      "if((aggregate.sizeAvail) <= 1024,concat(aggregate.sizeAvail,' B')," +
      "if((aggregate.sizeAvail/1024) <= 1024,concat(round(aggregate.sizeAvail/1024,2),' KB')," +
      "if((aggregate.sizeAvail/1024/1024) <= 1024,concat(round(aggregate.sizeAvail/1024/1024,2),' MB')," +
      "if((aggregate.sizeAvail/1024/1024/1024) <= 1024,concat(round(aggregate.sizeAvail/1024/1024/1024,2),' GB')," +
      "if((aggregate.sizeAvail/1024/1024/1024/1024) <= 1024,concat(round(aggregate.sizeAvail/1024/1024/1024/1024,2),' TB')," +
      "concat(round(aggregate.sizeAvail/1024/1024/1024/1024/1024,2),' PB')))))) AS 'available_data_capacity'," +
      "if((aggregate.sizeTotal) <= 1024,concat(aggregate.sizeTotal,' B')," +
      "if((aggregate.sizeTotal/1024) <= 1024,concat(round(aggregate.sizeTotal/1024,2),' KB')," +
      "if((aggregate.sizeTotal/1024/1024) <= 1024,concat(round(aggregate.sizeTotal/1024/1024,2),' MB')," +
      "if((aggregate.sizeTotal/1024/1024/1024) <= 1024,concat(round(aggregate.sizeTotal/1024/1024/1024,2),' GB')," +
      "if((aggregate.sizeTotal/1024/1024/1024/1024) <= 1024,concat(round(aggregate.sizeTotal/1024/1024/1024/1024,2),' TB')," +
      "concat(round(aggregate.sizeTotal/1024/1024/1024/1024/1024,2),' PB')))))) AS 'total_data_capacity'," +
      "if((aggregate.totalCommitted) <= 1024,concat(aggregate.totalCommitted,' B')," +
      "if((aggregate.totalCommitted/1024) <= 1024,concat(round(aggregate.totalCommitted/1024,2),' KB')," +
      "if((aggregate.totalCommitted/1024/1024) <= 1024,concat(round(aggregate.totalCommitted/1024/1024,2),' MB')," +
      "if((aggregate.totalCommitted/1024/1024/1024) <= 1024,concat(round(aggregate.totalCommitted/1024/1024/1024,2),' GB')," +
      "if((aggregate.totalCommitted/1024/1024/1024/1024) <= 1024,concat(round(aggregate.totalCommitted/1024/1024/1024/1024,2),' TB')," +
      "concat(round(aggregate.totalCommitted/1024/1024/1024/1024/1024,2),' PB')))))) AS 'committed_capacity' " +
      "FROM netapp_model.aggregate " +
      "LEFT JOIN netapp_model.node ON netapp_model.aggregate.nodeId = netapp_model.node.objid " +
      "WHERE netapp_model.aggregate.isRootAggregate=0 ";

    logger.info('aggreagate health MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
    connectionPool.getConnection(function(err, connection) {
      if(err){
        logger.error('aggreagate health MySQL Read: Connection Error: ' + err);
        //On error send empty output
        callback(err, [])
      }else{
        connection.query(args, function (err, result) {
          logger.info('aggreagate health MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
          if (err) {
            logger.info('aggreagate health MySQL Read: Error: ' + err);
          } else if (result.length > 0) {
            myCache.set( "aggregates", result, 100 );  
            callback(null, result);
          }
          callback(null, []);
          connection.release();
        });
      }
    });
  } else {
    logger.info("Loading aggregates from cache");
    //  logger.info(util.inspect(value, {showHidden: false, depth: null}));
    callback(null, value);
  }
};
 
exports.SVMRead = function (callback) {
  /*
   SELECT vserver.name AS 'svm_name', cluster.name AS 'cluster_name', vserver.operationalStateRaw AS 'ops_status',
   vserver.allowedProtocols AS 'protocols', vserver.language AS 'language'
  FROM netapp_model.vserver
  LEFT JOIN netapp_model.cluster ON netapp_model.vserver.clusterId = netapp_model.cluster.objid
  WHERE netapp_model.vserver.typeRaw = 'data' AND netapp_model.vserver.subtypeRaw = 'default';
  */
  var value = myCache.get("svms")
  if(value == undefined){
    var args = "SELECT vserver.name AS 'svm_name', cluster.name AS 'cluster_name', vserver.operationalStateRaw AS 'ops_status'," +
    "vserver.allowedProtocols AS 'protocols', vserver.language AS 'language' " +
    "FROM netapp_model.vserver " +
    "LEFT JOIN netapp_model.cluster ON netapp_model.vserver.clusterId = netapp_model.cluster.objid " +
    "WHERE netapp_model.vserver.typeRaw = 'data' AND netapp_model.vserver.subtypeRaw = 'default'";

    logger.info('SVM health MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
    connectionPool.getConnection(function(err, connection) {
      if(err){
        logger.error('SVM health MySQL Read: Connection Error: ' + err);
        //On error send empty output
        callback(err, [])
      }else{
        connection.query(args, function (err, result) {
          logger.info('SVM health MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
          if (err) {
            logger.info('SVM health MySQL Read: Error: ' + err);
          } else if (result.length > 0) {
            myCache.set( "svms", result, 100 );  
            callback(null, result);
          }
          callback(null, []);
          connection.release();
        });
      }
    });
  } else {
    logger.info("Loading svms from cache");
    //  logger.info(util.inspect(value, {showHidden: false, depth: null}));
    callback(null, value);
  }
};
 
exports.volumeRead = function (callback) {
  /*
SELECT volume.name AS 'volume_name', aggregate.name AS 'aggregate_name',
   vserver.name AS 'vserver_name', cluster.name AS 'cluster_name',
   IF(volume.sizeUsedPercent >= 90,'Volume is at 90% or above',IF(volume.stateRaw = 'offline','Volume is Offline',IF(volume.sisStateRaw = 'disabled','Volume efficiency is disabled','NA'))) AS 'error_status'
FROM netapp_model_view.volume LEFT JOIN netapp_model_view.cluster ON netapp_model_view.volume.clusterId = netapp_model_view.cluster.objid
LEFT JOIN netapp_model_view.vserver ON netapp_model_view.volume.vserverId = netapp_model_view.vserver.objid
LEFT JOIN netapp_model_view.aggregate ON netapp_model_view.volume.aggregateId = netapp_model_view.aggregate.objid
WHERE (volume.sizeUsedPercent >= 90 OR volume.stateRaw = 'offline' OR volume.sisStateRaw = 'disabled')
AND (volume.volTypeRaw = 'rw' AND volume.isVserverRoot = 0);

  */
 var value = myCache.get("volumes")
  if(value == undefined){
    var args = "SELECT volume.name AS 'volume_name', aggregate.name AS 'aggregate_name', " +
    "vserver.name AS 'vserver_name', cluster.name AS 'cluster_name', " +
    "IF(volume.sizeUsedPercent >= 90,'Volume is at 90% or above',IF(volume.stateRaw = 'offline','Volume is Offline',IF(volume.sisStateRaw = 'disabled','Volume efficiency is disabled','NA'))) AS 'error_status'  " +
    "FROM netapp_model_view.volume LEFT JOIN netapp_model_view.cluster ON netapp_model_view.volume.clusterId = netapp_model_view.cluster.objid  " +
    "LEFT JOIN netapp_model_view.vserver ON netapp_model_view.volume.vserverId = netapp_model_view.vserver.objid  " +
    "LEFT JOIN netapp_model_view.aggregate ON netapp_model_view.volume.aggregateId = netapp_model_view.aggregate.objid  " +
    "WHERE (volume.sizeUsedPercent >= 90 OR volume.stateRaw = 'offline' OR volume.sisStateRaw = 'disabled')  " +
    "AND (volume.volTypeRaw = 'rw' AND volume.isVserverRoot = 0)";

    logger.info('Volume health MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
    connectionPool.getConnection(function(err, connection) {
      if(err){
        logger.error('Volume health MySQL Read: Connection Error: ' + err);
        //On error send empty output
        callback(err, [])
      }else{
        connection.query(args, function (err, result) {
          logger.info('Volume health MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
          if (err) {
            logger.info('Volume health MySQL Read: Error: ' + err);
          } else if (result.length > 0) {
            myCache.set( "volumes", result, 100 );  
            callback(null, result);
          }
          callback(null, []);
          connection.release();
        });
      }
    });
  } else {
    logger.info("Loading volumes from cache");
    //  logger.info(util.inspect(value, {showHidden: false, depth: null}));
    callback(null, value);
  }
};

exports.lunRead = function (callback) {
  /*
SELECT lun.path AS 'path', volume.name AS 'volume_name', aggregate.name 'aggregate_name', vserver.name AS 'vserver_name', cluster.name AS 'cluster_name'
FROM netapp_model.lun
LEFT JOIN netapp_model.volume ON netapp_model.volume.objid = netapp_model.lun.volumeId
LEFT JOIN netapp_model.aggregate ON netapp_model.aggregate.objid = netapp_model.volume.aggregateId
LEFT JOIN netapp_model.vserver ON netapp_model.vserver.objid = netapp_model.lun.vserverId
LEFT JOIN netapp_model.cluster ON netapp_model.cluster.objid = netapp_model.lun.clusterId
WHERE netapp_model.lun.isOnline = 0;


  */
  var value = myCache.get("luns")
  if(value == undefined){
    var args = "SELECT lun.path AS 'path', volume.name AS 'volume_name', aggregate.name 'aggregate_name', vserver.name AS 'vserver_name', cluster.name AS 'cluster_name' " +
    "FROM netapp_model.lun " +
    "LEFT JOIN netapp_model.volume ON netapp_model.volume.objid = netapp_model.lun.volumeId " +
    "LEFT JOIN netapp_model.aggregate ON netapp_model.aggregate.objid = netapp_model.volume.aggregateId " +
    "LEFT JOIN netapp_model.vserver ON netapp_model.vserver.objid = netapp_model.lun.vserverId " +
    "LEFT JOIN netapp_model.cluster ON netapp_model.cluster.objid = netapp_model.lun.clusterId " +
    "WHERE netapp_model.lun.isOnline = 0;";

    logger.info('lun health MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
    connectionPool.getConnection(function(err, connection) {
      if(err){
        logger.error('lun health MySQL Read: Connection Error: ' + err);
        //On error send empty output
        callback(err, [])
      }else{
        connection.query(args, function (err, result) {
          logger.info('lun health MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
          if (err) {
            logger.info('lun health MySQL Read: Error: ' + err);
          } else if (result.length > 0) {
            myCache.set( "luns", result, 100 );  
            callback(null, result);
          }
          callback(null, []);
          connection.release();
        });
      }
    });
  } else {
    logger.info("Loading luns from cache");
    //  logger.info(util.inspect(value, {showHidden: false, depth: null}));
    callback(null, value);
  }
};
 


