'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  Schema = mongoose.Schema;

/**
 * Notification Schema
 */
var NotificationSchema = new Schema({
  category: {
    type: String,
    enum: {
      values: ['Information', 'Scheduled Maintenance', 'Service Disruption'],
      message: '`{VALUE}` not a valid value for category'
    },
    required: 'Category required'
  },
  summary: {
    type: String,
    trim: true,
    required: 'Summary required',
    maxlength: [64, 'Summary: Maximum 64 chars allowed'] ,
    minlength: [3, 'Summary: Minimum 3 chars required'],
    match: [ /^[a-zA-Z0-9_ -]*$/ , 'Notification summary can only include alphanumeric, space, dash & underscore']
  },
  message: {
    type: String,
    trim: true,
    required: 'Message required',
    maxlength: [1024, 'Message: Maximum 1024 chars allowed'],
    minlength: [3, 'Message: Minimum 3 chars required'],
    match: [ /^[a-zA-Z0-9_ .,-]*$/ , 'Notification message can only include alphanumeric, space, dash, underscore, comma & dot']
  },
  tenants: [{
      type: Schema.ObjectId,
      ref: 'Tenant'
  }],
  start: {
    type: Date,
    required: 'Start Date required'
  },
  end: {
    type: Date,
    required: 'End Date required'
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  users: [{
      type: Schema.ObjectId,
      ref: 'User'
  }],
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  }
});

/**
 * Hook a pre validate method to validate the Tenants
 */
NotificationSchema.pre('validate', function (next, done) {
  var self = this;
  //check wether input date are in UTC format or not (UTC timezone)
  if(self.start && ! /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})\.(\d{3})Z/.test(self.start.toISOString())) {
    logger.info('Notification Model: Start date should be in UTC format.');
    self.invalidate('start', 'Start date should be in UTC format.');
  }

  if(self.end && ! /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})\.(\d{3})Z/.test(self.end.toISOString())) {
    logger.info('Notification Model: End date should be in UTC format.');
    self.invalidate('end', 'End date should be in UTC format.');
  }  
  
  if (self.start && self.end && self.start > self.end) {
    logger.info('Notification Model: EndDate should be greater than startDate.');
    self.invalidate('end', 'EndDate should be greater than startDate.');
  }
 
  if (!this.isNew) {
    next();
  } else {
    var now = new Date();
    var curDate =  new Date(now.getTime() + now.getTimezoneOffset()*60000);
    if (self.start && (self.start.getTime() + now.getTimezoneOffset()*60000) < curDate.getTime()) {
      logger.info('Notification Model: StartDate should not be lesser than today.');
      self.invalidate('start', 'StartDate should not be lesser than today.');
    }
    if (self.tenants.length > 0) {

      self.tenants.forEach(function (tenantId) {
        mongoose.model('Tenant').findById(tenantId).exec(function (err, tenant) {
          if (err) {
            logger.info('Notification Model: ' + err);
            self.invalidate('tenants', 'Invalid Tenant ID');
            next();
          } else if (!tenant) {
            logger.info('Notification Model: Invalid Tenant ID');
            self.invalidate('tenants', 'Invalid Tenant ID');
            next();
          } else {
            next();
          }
        });
      });
    } else {
      next();
    }
  }
});

NotificationSchema.methods.toJSON = function () {
  var obj = this.toObject();
  obj.notificationId = obj._id;
  delete obj.user;
  delete obj._id;
  delete obj.__v;
  delete obj.created;
  return obj;
};

mongoose.model('Notification', NotificationSchema);
