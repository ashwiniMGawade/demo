'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  Icr = mongoose.model('Icr'),
  config = require(path.resolve('./config/config')),
  Server = mongoose.model('Server'),
  Job = mongoose.model('Job'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  featuresSettings = require(path.resolve('./config/features')),
  nodemailer = require('nodemailer'),
  smtpTransport = require('nodemailer-smtp-transport'),
  transporter = nodemailer.createTransport(smtpTransport());

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
    res.status(errCode).send({
     message: errMessage
    });
};

/**
 * Send Email
 */
var sendEmail = function (email) {

    var mailOptions = {
      from: email.from, // sender address
      to: email.to, // list of receivers
      bcc: email.bcc, // Managed Services distribution list
      subject: email.subject, // Subject line
      html: email.htmlBody// html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        transporter.close();
        return console.log(error);
      }
      console.log('Email sent to ' + mailOptions.to);
      transporter.close();  
    });
};

/**
 * Create a icr
 */
exports.create = function (req, res) {
  var icr = new Icr();
  var ICRCreateJob;

  icr.user = req.user;
  icr.message = req.body.message;
  icr.clusterExt = req.body.clusterExt;
  icr.ipsExt = req.body.ipsExt;
  var serverName, tenantName;

  if (_.includes(req.user.roles, 'root') && req.body.tenantId) {
    if (mongoose.Types.ObjectId.isValid(req.body.tenantId)) {
      icr.tenant = mongoose.Types.ObjectId(req.body.tenantId);
    } else {
      icr.tenant = mongoose.Types.ObjectId();
    }
  } else {
    icr.tenant = mongoose.Types.ObjectId(icr.user.tenant);
  }

  if (req.body.serverId) {
    if (mongoose.Types.ObjectId.isValid(req.body.serverId)) {
      icr.server = mongoose.Types.ObjectId(req.body.serverId);
    } else {
      icr.server = mongoose.Types.ObjectId();
    }
  }

  icr.validate(function(err) {
    if (err) {
      var errMsg = '';
      _.forOwn(err.errors, function(error, field) {
        errMsg = errMsg + error.message + ".";
      });
      return respondError(res, 400, errMsg);
    } else {
      Job.create(req, 'icr', function(err, createRes) {
        ICRCreateJob = createRes;
        icr.save(function (err) {
          if (err) {
            ICRCreateJob.update('Failed', err, icr);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            Icr.findById(icr._id)
            .populate('tenant','name code')
            .populate('subtenant','name code')
            .populate('partner','name code')
            .populate('server','name code')
            .exec(function (err, icr) {
              tenantName = icr.tenant.name;
              serverName = icr.server.name;

              var email = getEmailTemplate({
                tenantName: tenantName,
                serverName: serverName,
                email: req.user.email,
                icr: icr,
                edit: false
              });
              sendEmail(email);
              ICRCreateJob.update('Completed', null, icr);
              res.json(icr);
            });
          }
        });
      });
    }
  });
};

/**
* Prepare Html template
*
**/
function getEmailTemplate(emailParams) {
  var htmlBody = '<pre>' + '<div style="font-size:15px;font-family:arial;color:#222;" >'+
                  '<h3 style="color:#222;">Virtual Storage Inter-cluster relationship' + ((emailParams.edit) ? ' update ' : ' enabled ') + 'for ' + emailParams.tenantName + '</h3>' +
                   '<p style="color:#222;">' + emailParams.icr.message + '</p>' +
                   '<p style="color:#222;">'+ featuresSettings.labels.server.serverName+': ' + emailParams.serverName + '<br>' +
                   '<span style="color:#222;">External Cluster: ' + ((emailParams.icr.clusterExt)? emailParams.icr.clusterExt:'') + '</span><br><span style="color:#222;"' +
                   'External Cluster Inter-cluster IP addresses: ' + ((emailParams.icr.ipsExt)? emailParams.icr.ipsExt:'') + '<br>' +
                   'Status: '+ emailParams.icr.status+ '</p>'+
                   '</div></pre>'+   featuresSettings.labels.app.emailFooter  +              
                   '<div style="margin-top:10px;"><span style="color:#222;"><i style="font-size:9px;font-family:sans-serif" class="MsoNormal"><b>Disclaimer</b>'+
                   '<br/>This is an automated email. Please do not reply.'+ 
                   'This communication may contain confidential and privileged material for the sole use of the intended recipient.'+
                   'Any unauthorised review, use or distribution by others is strictly prohibited.'+
                   'If you have received the message by mistake, please delete the message. Thank you.</i></span><div>';
  var email = {
    from: '"Virtual Storage" <noreply@netapp.com>', // sender address
    to: emailParams.email, // list of receivers
    subject: 'Virtual Storage Inter-cluster relationship', // Subject line
    htmlBody:  htmlBody , // html body
    bcc: config.netappBCCMailer || ''
  };

  return email;
}

/**
 * Show the current icr
 */
exports.read = function (req, res) {
  res.json(req.icr);
};

/**
 * Update a icr
 */
exports.update = function (req, res) {
  var icr = req.icr;
  var ICRUpdateJob;
  if (icr.status === 'Closed') {
    return respondError(res, 400, 'Can not update the Closed ICR');
  }

  icr.message = _.isUndefined(req.body.message) ? icr.message : req.body.message;
  icr.clusterExt = _.isUndefined(req.body.clusterExt) ? icr.clusterExt : req.body.clusterExt;
  icr.ipsExt = _.isUndefined(req.body.ipsExt) ? icr.ipsExt : req.body.ipsExt;

  if (_.includes(req.user.roles, 'root')) {
    icr.status = _.isUndefined(req.body.status) ? icr.status : req.body.status;
  }

  icr.validate(function(err) {
    if (err) {
      var errMsg = '';
      _.forOwn(err.errors, function(error, field) {
        errMsg = errMsg  + error.message + ".";
      });
      return respondError(res, 400, errMsg);
    } else {
      Job.create(req, 'icr', function(err, createRes) {
        ICRUpdateJob = createRes;
        icr.save(function (err) {
          if (err) {
            ICRUpdateJob.update('Failed', err, icr);
            return respondError(res, 400, errorHandler.getErrorMessage(err) );
          } else {
            Icr.findById(icr._id)
            .populate('tenant','name code')
            .populate('partner','name code')
            .populate('subtenant','name code')
            .populate('server','name code')
            .exec(function (err, icr) {
              if (err) {
                ICRUpdateJob.update('Failed', err, icr);
                return respondError(res, 400, errorHandler.getErrorMessage(err) );
              } else {
                // Prepare email body and send to desired address
                var tenantName = icr.tenant.name;
                var serverName = icr.server.name;
                User.findById(icr.user).exec(function (err, user) {
                  var email = getEmailTemplate({
                    tenantName: tenantName,
                    serverName: serverName,
                    email:user.email,
                    icr: icr,
                    edit:true
                  });
                  sendEmail(email);
                });
                ICRUpdateJob.update('Completed', null, icr);
                res.json(icr);
              }
            });
          }
        });
      });
    }
  });
};

/**
 * Delete an icr
 */
exports.delete = function (req, res) {
  var icr = req.icr;
  var ICRDeleteJob;
  Job.create(req, 'icr', function(err, createRes) {
    ICRDeleteJob = createRes;
    if (_.includes(req.user.roles, 'admin')) {
      icr.status =  'Deleting';
      icr.save(function (err) {
        if (err) {
          ICRDeleteJob.update('Failed', err, icr);
          return respondError(res, 400, errorHandler.getErrorMessage(err) );
        } else {     
            // Prepare email body and send to desired address
          var tenantName = icr.tenant.name;
          var serverName = icr.server.name;
          User.findById(icr.user).exec(function (err, user) {
            var email = getEmailTemplate({
              tenantName: tenantName,
              serverName: serverName,
              email:user.email,
              icr: icr,
              edit:true
            });
            sendEmail(email);
            ICRDeleteJob.update('Completed', null, icr);
            res.json({});
          });         
        }
      });
    }
    if (_.includes(req.user.roles, 'root')) {
      icr.remove(function (err) {
        if (err) {
          ICRDeleteJob.update('Failed', err, icr);
          return respondError(res, 400, errorHandler.getErrorMessage(err) );
        } else {
          ICRDeleteJob.update('Completed', null, icr);
          res.json({});
        }
      });
    }      
  });
};

/**
 * List of Icrs
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var query =  Icr.find({})
    .populate('tenant','name code')
    .populate('partner','name code')
    .populate('subtenant','name code')
    .populate('server','name code');

  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
  } else if (_.includes(req.user.roles, 'partner')) {
    query.where({ $or:[ {'tenant':req.user.tenant }, {'partner':req.user.tenant } ] });
  } else {
    query.where({ 'tenant': req.user.tenant });
  }

  query.exec(function (err, storagegroups) {
    respondList(err, storagegroups);
  });

  function respondList(err, storagegroups) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      res.json(storagegroups);
    }
  }
};

/**
 * Icr middleware
 */
exports.icrByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return respondError(res, 400, 'Icr is invalid');
  }

  Icr.findById(id)
  .populate('tenant','name code')
  .populate('partner','name code')
  .populate('subtenant','name code')
  .populate('server','name code')
  .exec(function (err, icr) {
    if (err) {
      return next(err);
    } else if (!icr) {
      return res.status(404).send({
        message: 'No icr with that identifier has been found'
      });
    }
    req.icr = icr;
    next();
  });
};
