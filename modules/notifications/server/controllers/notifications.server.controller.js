'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  moment = require('moment'),
  config = require(path.resolve('./config/config')),
  NotificationSchema = mongoose.model('Notification'),
  logger = require(path.resolve('./config/lib/log')),
  Tenant = mongoose.model('Tenant'),
  User = mongoose.model('User'),
  util = require('util'),
  Job = mongoose.model('Job'),
  featuresSettings = require(path.resolve('./config/features')),
  nodemailer = require('nodemailer'),
  smtpTransport = require('nodemailer-smtp-transport'),
  transporter = nodemailer.createTransport(smtpTransport()),
  _ = require('lodash'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var checkValidDate = function(date) {
  if (Date.parse(date) && moment(date).isValid()) {
    return true;
  } else {
    return false;
  }
};

// To respond with proper error message
var respondError = function(res, errCode, errMessage){
  res.status(errCode).send({
   message: errMessage
  });
};

var getUsersFromTenats = function(tenants, callback) {
  var query = User.find();
  if (!tenants.length) {
    query = query.where(
      {'tenant': {$ne: null}}
    );
  } else {
    var tenantsArray = _.map(tenants, '_id');
    query = query.where({
      'tenant' : {$in : tenantsArray}
    });
  }
  query.exec(function (err, users) {
    if(err) {
      console.log(err);
    } else {
      callback(users);
    }
  });
};

/**
* Prepare Html template
*
**/
function getEmailTemplate(emailParams) {
  var htmlBody = '<pre><div style="font-size:15px;font-family:arial;color:#222;">'+
                 '<h3 style="color:#222;">'+ emailParams.notification.category + ' & Notification:</h3>' +
                  '<h5>Summary: ' + emailParams.notification.summary + '</h5>'+
                   '<p style="color:#222;">' + emailParams.notification.message + '</p>'+
                   '</p>' +
                   '<p style="color:#222;">Start date and time: '+ emailParams.notification.start + '</p>' +
                   '<p style="color:#222;">End date and time: '+ emailParams.notification.end + '</p>' +
                   '</div></pre>'+  featuresSettings.labels.app.emailFooter  +                  
                   '<div style="margin-top:10px;"><span style="color:#222;"><i style="font-size:9px;font-family:sans-serif"><b>Disclaimer</b>'+
                   '<br/>This is an automated email. Please do not reply.'+ 
                   'This communication may contain confidential and privileged material for the sole use of the intended recipient.'+
                   'Any unauthorised review, use or distribution by others is strictly prohibited.'+
                   'If you have received the message by mistake, please delete the message. Thank you.</i><div?';

  var email = {
    from: '"Virtual Storage" <noreply@netapp.com>', // sender address
    to: emailParams.email, // list of receivers
    subject: 'Virtual Storage Service Notification', // Subject line
    htmlBody: '<pre>' + htmlBody + '</pre>', // html body
    bcc: config.netappBCCMailer || ''
  };

  return email;
}


/**
 * Send Email
 */
var sendEmail = function (email) {

    var mailOptions = {
      from: email.from, // sender address
      to: email.to, // list of receivers
      subject: email.subject, // Subject line
      html: email.htmlBody, // html body
      bcc:email.bcc
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



var sendEmailToTenantusers = function(notification) {
  if (notification.sendEmail) {
    getUsersFromTenats(notification.tenants, function(users) {
      _.forEach(users, function(user) {
        var email = getEmailTemplate({
          email: user.email,
          notification: notification
        });
        sendEmail(email);
      });
    });
  }
};


/**
 * Create an notification
 */
exports.create = function (req, res) {
  var notification = new NotificationSchema();
  notification.user = req.user;
  notification.category = req.body.category;
  notification.summary = req.body.summary;
  notification.message = req.body.message;

  if (checkValidDate(req.body.start)) {
    notification.start =  req.body.start;
  } else {
    return respondError(res, 400, "Invalid start date.");
  }

  if (checkValidDate(req.body.end)) {
    notification.end =  req.body.end;
  } else {
    return respondError(res, 400, "Invalid end date.");
  }

  req.body.sendEmail = req.body.sendEmail ? req.body.sendEmail : false;

  if (typeof req.body.sendEmail !== 'boolean') {
    return respondError(res, 400, "sendEmail should be of Boolean type");
  }

  notification.sendEmail = req.body.sendEmail;
  notification.users = [];

  if (req.body.tenantsId && Array.isArray(req.body.tenantsId)) {
    req.body.tenantsId.forEach(function (tenantId) {
      if (mongoose.Types.ObjectId.isValid(tenantId)) {
        notification.tenants.push(mongoose.Types.ObjectId(tenantId));
      }
    });
  } else {
    notification.tenants = [];
  }

  notification.validate(function(err) {
    if (err) {
      var errMsg = {};
      _.forOwn(err.errors, function (error, field) {
        logger.info(field, error.message);
        errMsg[field] = error.message;
      });
      return respondError(res, 400, errMsg);
    } else {
      var portalCreateJob;
      Job.create(req, 'notification', function(err, createRes) {
        portalCreateJob = createRes;
        notification.save(function (err) {
        if (err) {
            portalCreateJob.update('Failed', err, notification);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {
            NotificationSchema.findById(notification._id).populate('tenants', 'name code').populate('users', 'username').exec(function (err, notification) {
              portalCreateJob.update('Completed', null, notification);              
              res.json(notification);
              sendEmailToTenantusers(notification);
            });
          }
        });
      });
    }
  });

};

var formatResponseObject = function(req, notification) {
  if (!_.includes(req.user.roles, 'root')) {    
    notification = notification.toObject();
    notification.acknowledge = _.includes(_.invokeMap(notification.users, 'toString'), req.user._id.toString());
    notification.notificationId = notification._id;
    delete notification.users;    
    delete notification.tenants;    
    delete notification.sendEmail;
    delete notification.user;
    delete notification.created;
    delete notification._id;
    delete notification.__v;
  }
  return notification;  
};

/**
 * Show the current notification
 */
exports.read = function (req, res) {
  if (!(_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops'))) {
    var notification = formatResponseObject(req, req.notification);
    res.json(notification);  
  } else {   
    NotificationSchema.findById(req.notification._id).populate('tenants', 'name code').populate('users', 'username').exec(function (err, notification) {
      res.json(notification);
    });
  }
};


/**
 * Update a notification
 */
exports.update = function (req, res) {
  var notification = req.notification;
  var portalUpdateJob;
  if (!(_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops'))) {
    notification.users = _.unionWith(notification.users, [req.user._id],  _.isEqual);
  } else {
    notification.category = _.isUndefined(req.body.category) ? notification.category : req.body.category;
    notification.summary = _.isUndefined(req.body.summary) ? notification.summary : req.body.summary;
    notification.message = _.isUndefined(req.body.message) ? notification.message : req.body.message;

    if (!_.isUndefined(req.body.start)) {
      if (checkValidDate(req.body.start)) {
        notification.start =  req.body.start;
      } else {
        return respondError(res, 400, "Invalid start date.");
      }
    }

    if (!_.isUndefined(req.body.end)) {
      if (checkValidDate(req.body.end)) {
        notification.end =  req.body.end;
      } else {
        return respondError(res, 400, "Invalid end date.");
      }
    }

    //make read by users blank on update by root user
    notification.users = [];
  }
  notification.validate(function(err) {
    if (err) {
      var errMsg = {};
      _.forOwn(err.errors, function (error, field) {
        logger.info(field, error.message);
        errMsg[field] = error.message;
      });
      return respondError(res, 400, errMsg);
    } else {
      Job.create(req, 'notification', function(err, createRes) {
        portalUpdateJob = createRes;
        notification.save(function (err) {
          if (err) {
            portalUpdateJob.update('Failed', err, notification);
            return respondError(res, 400, errorHandler.getErrorMessage(err));
          } else {            
            NotificationSchema.findById(notification._id).populate('tenants', 'name code').populate('users', 'username').exec(function (err, notificationPopulated) {
              if (err) {
                portalUpdateJob.update('Failed', err, notificationPopulated);
                return respondError(res, 400, errorHandler.getErrorMessage(err));
              } else {
                portalUpdateJob.update('Completed', null, notificationPopulated);                
                res.json(formatResponseObject(req, notification));
                if (_.includes(req.user.roles, 'root')) {
                  sendEmailToTenantusers(notificationPopulated);
                }
              }
            });
          }
        });
      });
    }
  });

};

/**
 * Delete an notification
 */
exports.delete = function (req, res) {
  var notification = req.notification;
  var portalDeleteJob;

  Job.create(req, 'notification', function(err, createRes) {
    if (err) {
      console.log(err);
    } else {
      portalDeleteJob = createRes;
      notification.remove(function (err) {
      if (err) {
        portalDeleteJob.update('Failed', err, notification);
        return respondError(res, 400, errorHandler.getErrorMessage(err));
      } else {
        portalDeleteJob.update('Completed', null, notification);
        res.json({});
      }
    });
  }
  });
};

/**
 * List of Notifications
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  var utcMoment = moment.utc();
  var curDate = new Date( utcMoment.format());


  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
    NotificationSchema.find().populate('tenants', 'name code').populate('users', 'username').exec(function (err, notifications) {
      respond(err, notifications);
    });
  } else {
    var query =  NotificationSchema.find();    
    query = query.where({
      $or: [
        {'tenants': req.user.tenant},
        {'tenants': {$exists: true, $size: 0}}
      ],
      'end': {$gte: curDate},
      'start': {$lte: curDate}
    }, 'summary message category users start end');

    query.exec(function (err, notifications) {
      if (notifications.length > 0) {
        var notificationsObj = [];
        notifications.forEach(function (notification, index) {
          var notificationObj = notification.toObject();

          notificationObj.notificationId = notification._id;
          notificationObj.acknowledge = _.includes(_.invokeMap(notificationObj.users, 'toString'), req.user._id.toString());
          delete notificationObj.users;
          delete notificationObj._id;
          delete notificationObj.__v;
          delete notificationObj.user;
          delete notificationObj.tenants;
          delete notificationObj.sendEmail;
          delete notificationObj.created;
          notificationsObj.push(notificationObj);

          if (index === notifications.length - 1) {
            respond(err, notificationsObj);
          }
        });
      } else {
        respond(err, notifications);
      }
    });
  }

  function respond(err, notifications) {
    if (err) {
      return respondError(res, 400, errorHandler.getErrorMessage(err));
    } else {
      res.json(notifications);
    }
  }
};

/**
 * Notification middleware
 */
exports.notificationByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return respondError(res, 400, 'Notification is invalid');
  }

  NotificationSchema.findById(id).exec(function (err, notification) {
    if (err) {
      return next(err);
    } else if (!notification) {
      return respondError(res, 400, 'No notification with that identifier has been found');
    }
    req.notification = notification;
    next();
  });
};
