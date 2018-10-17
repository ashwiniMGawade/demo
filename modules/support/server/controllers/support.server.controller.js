'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),  
  logger = require(path.resolve('./config/lib/log')),
  User = mongoose.model('User'),
  mime = require('mime'),
  Job = mongoose.model('Job'),
  fs = require('fs'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


// To respond with proper error message
function respondError(res, errCode, errMessage){
    res.status(errCode).send({
     message: errMessage
    });
}

var softwareFiles = {
  'OCUM' : 'OnCommandUnifiedManager-7.2RC1.ova',
  'cloud-manager': 'OnCommandCloudManager-V3.2.0.sh',
  'ontapdsm':'OntapDSM/ntap_win_mpio_4.1P1_setup_x64.msi'
}

var keyFiles = {
  'ontapdsm': 'OntapDSM/OntapDSM_MPIO_License_key.txt'
}

/**
 * List of Allowed Status
 */
exports.downloadJobStatus = function (req, res) {  
    try {
      if (req.query['software']) {
        logger.info(req.query['software']);
        if (softwareFiles[req.query['software']]) {
          var filePath = path.resolve('./docs/' + softwareFiles[req.query['software']]);    
          logger.info(filePath);
          Job.create(req, 'support', function(err, createJobRes) {
            if (err) {
              createJobRes.update('Failed', "Err on Save : " + err, {});
              return respondError(res, 400, errorHandler.getErrorMessage(err));
            } else {
              createJobRes.update('Completed', "Successfully downloaded the software", {});
              res.download(filePath);
            }
          });      
        } else {
          return respondError(res, 400, 'Invalid Software');
        }        
      }      
    } catch(e) {
      console.log(e);
      //logger.info(e);
    }
  };

exports.getSoftwareKey = function(req, res) {
   try {
      if (req.query['software']) {
        logger.info(req.query['software']);
        if (keyFiles[req.query['software']]) {
          var filePath = path.resolve('./docs/' + keyFiles[req.query['software']]); 
          logger.info(filePath);
          fs.readFile(filePath, 'utf8', function (err, data) {
            if (err) {
             return respondError(res, 400, 'Can not open the file');
            } else {
              res.end(data);
            }
          });
        } else {
          return respondError(res, 400, 'Invalid Software');
        }        
      }      
    } catch(e) {
      console.log(e);
    }
};


exports.acceptPolicy = function(req, res) {
  var userId = req.user._id;

  User.findById(userId, '-salt')
  .exec(function (err, user) {
    if (err) {
      return respondError(res, 400, 'Invalid UserID');
    } else if (!user) {
      return respondError(res, 400, 'Invalid UserID');
    }   
    user.acceptTC = true;
    user.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {        
        Job.create(req, 'support', function(err, updadteUserJob) {
          // Remove sensitive data
          User.findById(user._id, '-salt -password')
          .populate('tenant', 'name code')
          .populate('partner', 'name code')
          .exec(function (err, user) {
            if (err) {
              updadteUserJob.update('Failed', err, {});
              return err;
            } else if (!user) {
              updadteUserJob.update('Failed', 'Failed to load user ' + user._id, {});
              return new Error('Failed to load user ' + user._id);
            }
            updadteUserJob.update('Completed', null, {});
            res.json(user);
          });
        });
      }
    });
  });
};
