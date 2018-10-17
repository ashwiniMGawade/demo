'use strict';

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
