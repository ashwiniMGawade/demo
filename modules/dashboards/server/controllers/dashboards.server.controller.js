'use strict';


/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Dashboard = mongoose.model('Dashboard'),
  Tenant = mongoose.model('Tenant'),
  Server = mongoose.model('Server'),
  Storagegroup = mongoose.model('Storagegroup'),
  EseriesAsup = mongoose.model('eseries_asup_health'),
  EseriesContoller = mongoose.model('eseries_controller_health'),
  EseriesDrive = mongoose.model('eseries_drive_health'),
  EseriesInterface = mongoose.model('eseries_interface_health'),
  EseriesPool = mongoose.model('eseries_pool_health'),
  EseriesSystem = mongoose.model('eseries_system_health'),
  EseriesVolume = mongoose.model('eseries_volume_health'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  request = require('then-request'),
  config = require(path.resolve('./config/config')),
  logger = require(path.resolve('./config/lib/log')),
  fs = require('fs'),
  async = require('async'),
  _ = require('lodash');

  // To respond with proper error message
  var respondError = function(res, errCode, errMessage){
      res.status(errCode).send({
       message: errMessage
      });
  };

  var fromMap = {
    y : '-1y',
    mon : '-1mon',
    w : '-1w',
    d : '-1d',
    h : '-2h'
  };

/**
 * List of Dashboards
 */
exports.getGraphs = function (req, res) {

  var roles = (req.user) ? req.user.roles : ['guest'];

  //Validation
  if(!_.includes(['capacity','throughput','iops','latency'], req.query.statistic)){
    return respondError(res, 400, "Invalid graph statistic");
  }
  if(!_.includes(['y','mon','w','d','h'], req.query.from)){
    return respondError(res, 400, "Invalid value for from");
  }
  if(!_.includes(['tenant','server','storagegroup'], req.query.scope)){
    return respondError(res, 400, "Invalid value for Scope");
  }

  var URI = "";
  if(req.query.scope === 'tenant'){
    if(!req.query.objectId) return respondError(res, 400, "Tenant ID missing");
    Tenant.findById(req.query.objectId).exec(function (err, tenant) {
      if(err || !tenant) return respondError(res, 400, "Invalid Tenant ID");
      //Root gets to access all tenants dashboard
      if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
      //Partner gets to access all objects under tenancy and his partner tenancy
      } else if ( _.includes(roles, 'partner') &&
                  ( (tenant._id.toString() === req.user.tenant.toString()) ||
                    (tenant.partner && tenant.partner.toString() === req.user.tenant.toString()) ) ) {
      //Others gets to access all objects under their tenancy
      } else if ( tenant._id.toString() !== req.user.tenant.toString()) {
        return respondError(res, 403, 'User is not authorized');
      }
      prepareGraphiteURI(tenant);
    });
  }else if(req.query.scope === 'server'){
    if(!req.query.objectId) return respondError(res, 400, "Server ID missing");
    Server.findById(req.query.objectId).exec(function (err, server) {
      if(err || !server) return respondError(res, 400, "Invalid Server ID");
      //Root gets to access all tenants dashboard
      if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
      //Partner gets to access all objects under tenancy and his partner tenancy
      } else if ( _.includes(roles, 'partner') &&
                  ( (server.tenant.toString() === req.user.tenant.toString()) ||
                    (server.partner.toString() === req.user.tenant.toString()) ) ) {
      //Others gets to access all objects under their tenancy
      } else if ( server.tenant.toString() !== req.user.tenant.toString()) {
        return respondError(res, 403, 'User is not authorized');
      }
      Tenant.findById(server.tenant).exec(function (err, tenant) {
        prepareGraphiteURI(tenant, server);
      });
    });
  }else if(req.query.scope === 'storagegroup'){
    if(!req.query.objectId) return respondError(res, 400, "Storagegroup ID missing");
    Storagegroup.findById(req.query.objectId).populate('server','name code').exec(function (err, storagegroup) {
      if(err || !storagegroup) return respondError(res, 400, "Invalid Storagegroup ID");
      //Root gets to access all tenants dashboard
      if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
      //Partner gets to access all objects under tenancy and his partner tenancy
      } else if ( _.includes(roles, 'partner') &&
                  ( (storagegroup.tenant.toString() === req.user.tenant.toString()) ||
                    (storagegroup.partner.toString() === req.user.tenant.toString()) ) ) {
      //Others gets to access all objects under their tenancy
      } else if (storagegroup.tenant.toString() !== req.user.tenant.toString()) {
        return respondError(res, 403, 'User is not authorized');
      }
      Server.findById(storagegroup.server).exec(function (err, server) {
        Tenant.findById(storagegroup.tenant).exec(function (err, tenant) {
          prepareGraphiteURI(tenant, server, storagegroup);
        });
      });
    });
  }

  function prepareGraphiteURI(tenant, server, sg){
    var dbWfa = require('./dashboards.server.wfa.db.read');    
    URI += config.graphite.url;
    URI += req.query.scope === 'tenant' ? config.graphite.target.tenant[req.query.statistic]:'';
    URI += req.query.scope === 'server' ? config.graphite.target.server[req.query.statistic]:'';
    URI += req.query.scope === 'storagegroup' ? config.graphite.target.volume[req.query.statistic]:'';

    URI += '&from='+fromMap[req.query.from];
    URI += '&tz=Australia/ACT&format=csv';

    URI = URI.replace(/#SVM/g, (server && server.code) ? server.code : '');
    console.log(URI);
    URI = URI.replace(/#Tenant/g, (tenant && tenant.code) ? tenant.code : '');
    console.log(URI);
    URI = URI.replace(/#Volume/g, (sg && sg.code) ? sg.code : '');
    logger.info("Graphite URL :" + URI);

   dbWfa.acRead(tenant, server, sg, function(err, showGraphs) {
      if (err) {
        logger.info(err);
        var body = "Series,Date,Values\n";
        res.send(body);
      } else {
        if (showGraphs) {
          logger.info("called request grafite");
          requestGraphite();
        } else {
          var body = "Series,Date,Values\n";
          res.send(body);
        }    
      }      
    });    
  }

  function requestGraphite(){
    var options = {
      headers: {
        Authorization: "Bearer " + config.graphite.apikey,
        rejectUnhauthorized : false
      }
    };

    try {
      request('GET', URI, options)
      .then(function(gres){
        var body = "Series,Date,Values\n"+gres.getBody();
        res.send(body);
      })
      .catch(function(e) {
        logger.info("called in catch of request to grafana");
        logger.info(JSON.stringify(e));
        return res.status(500).send({
          message: errorHandler.getErrorMessage(e)
        });
      });      
    } catch(e) {
      logger.info("caught execption in grafana");
      logger.info(e);
    }    
  }
};

exports.getTestGraph = function(req, res) {
  res.json([
    {"name": "Healthy", "wc": 10},
    {"name": "At Risk", "wc": 90 },
    {"name": "Have Incidents", "wc": 60 }
    ]);
}

exports.getOntapHealthData =function(req, res) {
  var type = req.params.type
  var dbWfa = require('./dashboards.server.wfa.db.read');    

  var callback = function(err, results) {
    if (err) {
      logger.info(err);
      return respondError(res, 400, err);
    } else {
      var resultJson = JSON.stringify(results);
      resultJson = JSON.parse(resultJson);
      res.send(resultJson)
    }      
  }; 

  if (type == "clusters") {
    dbWfa.clusterRead(callback);    
  } 

  if (type == "nodes") {
    dbWfa.nodeRead(callback);    
  } 

  if (type == "aggregates") {
    dbWfa.aggregateRead(callback);    
  } 

  if (type == "svms") {
    dbWfa.SVMRead(callback);    
  } 

  if (type == "volumes") {
    dbWfa.volumeRead(callback);    
  } 

  if (type == "luns") {
    dbWfa.lunRead(callback);    
  } 

 
}

exports.getEseriesHealthData =function(req, res) {
  var type = req.params.type

  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var callback = function(err, results) {
    console.log(err, results)
    if (err) {
      logger.info(err);
      return respondError(res, 400, err);
    } else {
      res.json(results)
    }      
  }; 

  if (type == "asups") {      
    EseriesAsup.find({}).exec(callback);
  } 

  if (type == "controllers") {
    EseriesContoller.find().exec(callback);    
  } 

  if (type == "drives") {   
    EseriesDrive.find().exec(callback);
  } 

  if (type == "interfaces") {
    EseriesInterface.find().exec(callback);    
  } 

  if (type == "pools") {   
    EseriesPool.find().exec(callback);
  } 

  if (type == "systems") {
    EseriesSystem.find().exec(callback);    
  } 

  if (type == "volumes") {
    EseriesVolume.find().exec(callback);    
  } 
 
}


