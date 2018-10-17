'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
_ = require('lodash'),
  fs = require('fs'),
  config = require(path.resolve('./config/config')),
  logger = require(path.resolve('./config/lib/log')),
  parse = require('csv-parse'),
  mime = require('mime'),
  moment = require('moment'),
  Report = require('../models/reports.server.model'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'), 
  Storageunit = mongoose.model('Storageunit'), 
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  list;

module.exports = {
  list: list,
  read : read
};

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
    res.status(errCode).send({
     message: errMessage
    });
};

function downloadFile(filename, req, res) {
  try {
    Report.read(filename, function(err, file) {
      if (err === null) {
        var parser = parse({delimiter: ','});
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mime.lookup(file));
        res.setHeader('Transfer-Encoding', 'chunked');
        var filestream = fs.createReadStream(file);
        filestream.pipe(parser); 
        parser.on('error', function(error) {
          logger.info(JSON.stringify(error));
          res.removeHeader('Content-disposition');
          res.setHeader('Content-Type', "application/json");
          res.removeHeader('Transfer-Encoding');
          return res.status(500).send({
            message: 'Unknown error'
          });
        });
        parser.on('finish', function() {
          logger.info("parsed teh file successfully");
          var filestreamNew = fs.createReadStream(file);
          filestreamNew.pipe(res); 
        });        
        
      } else if (err.code === 'ENOENT') {
        return res.status(404).send({
          message: 'File Not Found'
        });
      } else if(err) {
        return res.status(404).send({
          message: 'File Not Found'
        });
      }
    });
  } catch(e) {
    console.log("exeception occured");
    if (e) {
      return res.status(500).send({
        message: 'Unknown error'
      });
    }
  }
}

/**
 * Download  the current report
 */
function read(req, res) {
  var filename = req.params.filename;
  var roles = req.user.roles;
  var file_parts = filename.split('_');
  var tenantCode = file_parts[1];
  if (file_parts.length < 3 || file_parts[0] !== 'dfaasreport') {
    logger.info("invalid file format");
    return respondError(res, 400, 'Invalid file format');
  }
  if (!(_.includes(roles, 'root') || _.includes(roles, 'l1ops'))) {
    mongoose.model('Tenant')
    .find({"code" : tenantCode})
    .populate('partner', 'name code')
    .exec(function (err, tenants) {
      if ( tenants.length > 0) {
        var tenant = tenants[0];    
        logger.info(tenant._id);
        logger.info(req.user.tenant);    
        if (!_.includes(roles, 'partner') && tenant._id.toString() === req.user.tenant.toString())
        {
          logger.info("tenancy condition met");
          downloadFile(filename, req, res);
        }
        else if ( _.includes(roles, 'partner') &&
                    ( (tenant._id.toString() === req.user.tenant.toString()) ||
                      (tenant.partner && tenant.partner._id.toString() === req.user.tenant.toString()) ) )
        {
          logger.info("Partner tenancy condition met");
          downloadFile(filename, req, res);
        }
        else {
          logger.info("Tenanncy condition failed");
          return respondError(res, 403, 'User is not authorized');
        }
      } else {
        return respondError(res, 403, 'User is not authorized');
      }      
    });
  } else {
    downloadFile(filename, req, res);
  }
}


//List of Reports
function list(req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var roles = (req.user) ? req.user.roles : ['guest'];

  if (typeof(req.query.tenant) === 'undefined') {
    return respondError(res, 400, 'Tenant ID Required');
  }
  if(!(mongoose.Types.ObjectId.isValid(req.query.tenant) || (req.query.tenant === 'all' && (_.includes(roles, 'root') || _.includes(roles, 'l1ops'))))) {
    return respondError(res, 400, 'Invalid Tenant ID');
  }

  if (! (req.query.start && req.query.end)) {
      req.query.start = null;
      req.query.end = null;
    }


  if (req.query.tenant === 'all' && (_.includes(roles, 'root') || _.includes(roles, 'l1ops'))) {
    console.log("called inside");
    getReportsList(req, res, null);  
  } else {
      mongoose.model('Tenant').findById(req.query.tenant).exec(function (err, tenant) {
        if (err) {
          return respondError(res, 400, 'Invalid Tenant ID');
        } else if (!tenant) {
          return respondError(res, 400, 'Invalid Tenant ID');
        } else {
          //Root gets to access all tenants report
          if (_.includes(roles, 'root') || _.includes(roles, 'l1ops')) {
          //Partner gets to access all objects under tenancy and his partner tenancy
          } else if ( _.includes(roles, 'partner') &&
                      ( (tenant._id.toString() === req.user.tenant.toString()) ||
                        (tenant.partner && tenant.partner.toString() === req.user.tenant.toString()) ) ) {
          //Others gets to access all objects under their tenancy
          } else if ( tenant._id.toString() !== req.user.tenant.toString()) {
            return respondError(res, 403, 'User is not authorized');
          }
        }
        //list reports      
        getReportsList(req, res, tenant);     
    });
  } 
}


var getReportsList =  function(req, res, tenant) {
   Report.list(req.query.tenant, req.query.start, req.query.end, function (err, reports) {
        if (err) {
          return res.status(400).send({
            message: err
          });
        } else {
          if (reports.length > 0) {
            return res.json(reports);
          } else {       
          
            var startDate;
            var yesterday = Date.UTC(
              new Date().getUTCFullYear(),            
              new Date().getUTCMonth(),
              new Date().getUTCDate(), //The due date for a file named dfaasreport_xxx_20170306.csv is 17:00 today in UTC time. (the following day 03:00 UTC+10 time)  
              config.reports.report_generation_time_UTC.hours,
              config.reports.report_generation_time_UTC.minutes
            );  
            
            if (req.query.start) {
              startDate = Date.UTC(
                req.query.start.substring(0, 4),
                parseInt(req.query.start.substring(4, 6)) -1,
                req.query.start.substring(6, 8),
                new Date().getUTCHours(),
                new Date().getUTCMinutes()
              ); 

              var endDate = Date.UTC(
                req.query.end.substring(0, 4),
                parseInt(req.query.end.substring(4, 6)) -1,
                req.query.end.substring(6, 8),
                new Date().getUTCHours(),
                new Date().getUTCMinutes()
              ); 

              //check the requested time and file generation time
              // startdate <= currrent date  && endDate<= current dates in utc use the time in config variable and have UTC time
              // if not send error message file is not yet generated
              console.log(req.query.start > req.query.end);
            }
           
            if (req.query.start && req.query.end && req.query.start > req.query.end){
              return res.status(400).send({
                message: "End date should be greater than or equal to start date"
              });
            } 
            else if(tenant && moment(tenant.created) > endDate) {
              return res.status(400).send({
                message: "Tenant not yet created"
              });
            } else if(moment(startDate).format('DD') == moment(yesterday).format('DD') && startDate < yesterday) {
              console.log("start date equals to yesterday bu report not generated");            
              return res.status(400).send({
                message: "Report is not yet generated"
              });
            }
            else if(moment(startDate).format('DD') == moment(yesterday).format('DD') && startDate > yesterday) {
              console.log("start date equals to yesterday reports are generated but files not found");            
              return res.status(500).send({
                message: "Unknown Error"
              });
            }
            else if (startDate && startDate > yesterday) {
              return res.status(400).send({
                message: "Start Date must be yesterday or before"
              });
            }
            else {
              return res.status(500).send({
                message: "Unknown Error"
              });
            } 
          }        
        }
      });
} 
