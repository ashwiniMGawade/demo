'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    mongoose = require('mongoose'),
    path = require('path'),
    logger = require(path.resolve('./config/lib/log')),
    Schema = mongoose.Schema;

/**
 * Storagegroup Schema
 */
var StoragegroupSchema = new Schema({
  name: {
    type: String,
    required: 'Storage Group name required',
    trim: true,
    minlength: [ 3, 'Minimum 3 char required'],
    maxlength: [ 64, 'Maximum 64 char allowed'],
    match: [ /^[a-zA-Z0-9\ -]*$/ , 'Storage Group name can only include alphanumeric, space & dash']
  },
  code: {
    type: String,
    required: 'Storage Group code required',
    trim: true,
    minlength: [ 3, 'Minimum 3 char required'],
    maxlength: [ 32, 'Maximum 32 char allowed'],
    match: [ /^[a-z][a-z0-9_]*$/ , 'Storage Group code can only include alphanumeric(lowercase) & underscore (First Char must be alphabetical)']
  },
  annotation: {
    type: String,
    trim: true,
    maxlength: [ 256, 'Maximum 256 char allowed'],
    match: [ /^[a-zA-Z0-9 -_]*$/ , 'Storage Group annotation can only include alphanumeric, space, dash & underscore']
  },
  server: {
    type: Schema.ObjectId,
    ref: 'Server',
    required: 'Storage Group Server ID required'
  },   
  tier: {
    type: String,
    default: 'value',
    required: 'Storage Group Tier required'
  },
  snapshotPolicy: {
    type: String,
    default: 'none',
    match: [ /^none$|^(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)$|^(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)-(5)weekly$|^(12|24)hourly-(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)$|^(12|24)hourly-(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)-(5)weekly$|^(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)-(1)monthly$|^(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)-(5)weekly-(1)monthly$|^(12|24)hourly-(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)-(1)monthly$|^(12|24)hourly-(7|14|30)daily(1810|2010|2210|0010|0210|0410|0610|0810)-(5)weekly-(1)monthly$/ ,
              'Invalid SnapshotPolicy'],
    required: 'Storage Group Snapshot Policy is required'
  },
  tenant_id: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  partner: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  subscription: {
    type: Schema.ObjectId,
    ref: 'Subscription'
  },
  subtenant_id: {
    type: Schema.ObjectId,
    ref: 'Subtenant'
  },
  status: {
    type: String,
    default: 'Creating',
    enum: {
            values: ['Creating', 'Updating', 'Deleting', 'Operational', 'Contact Support'],
            message: '`{VALUE}` not a valid value for Status'
          }
  },
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
 * Hook a pre save method to set the Tenant, subtenant
 */
StoragegroupSchema.pre('save', function (next, done) {
  if (!this.isNew) {
    next();
  } else {
    var self = this;
    mongoose.model('Server').findById(self.server).exec(function (err, server) {
      if (err) {
        logger.info('Storage Group Model: ' + err);
      } else if (!server) {
        logger.info('Storage Group Model: Invalid Server ID');
      } else {
        self.tenant_id = server.tenant;
        self.subtenant_id = server.subtenant;
        self.partner = server.partner;
        self.subscription = server.subscription;
      }
      next();
    });
  }
});

/**
 * Hook a pre validate method to test for a valid server
 */
StoragegroupSchema.pre('validate', function (next) {
  var self = this;

  if (this.isNew) {
    validServer();
  } else {
    uniqueName();
  }

  // Only checked with a new object (can not change storage group)
  function validServer() {
    mongoose.model('Server').findById(self.server).exec(function (err, server) {
      if (err) {
        logger.info('Storage Group Model: ' + err);
        self.invalidate('server', 'Invalid Server ID');
        next();
      } else if (!server) {
        logger.info('Storage Group Model: Invalid Server ID');
        self.invalidate('server', 'Invalid Server ID');
        next();
      } else if (self.user && self.user.tenant && !(_.isEqual(server.tenant, self.user.tenant) || _.isEqual(server.tenant, self.user.tenant._id))) {
        logger.info('Storage Group Model: Server belongs to different Tenant');
        self.invalidate('server', 'Invalid Server ID');
        next();
      } else if (server.status !== 'Operational') {
        logger.info('Storage Group Model: Server not Operational');
        self.invalidate('server', 'Server needs to be Operational');
        next();
      } else if (server.managed === 'Customer') {
        logger.info('Storage Group Model: Server not Portal-managed');
        self.invalidate('server', 'Server needs to be Portal-managed');
        next();
      } else {
        uniqueCode();
      }
    });
  }

  // Only checked with a new object (can not change code)
  function uniqueCode() {
    mongoose.model('Storagegroup').find({code: new RegExp('^'+ self.code + '$', "i"), server: self.server}).exec(function (err, storagegroup) {
      if (err) {
        logger.info('Storage Group Model: ' + err);
      } else if (storagegroup.length) {
        if (storagegroup.length > 1 || (storagegroup.length === 1 && storagegroup[0]._id.toString() !== self._id.toString())) {
          logger.info('Storage Group Model: Code not unique per Server');
          self.invalidate('code', 'Code has to be unique per Server');
        }
      }
      uniqueName();
    });
  }

  function uniqueName() {
    mongoose.model('Storagegroup').find({name: new RegExp('^' + self.name + '$', "i"), server: self.server}).exec(function (err, storagegroup) {
      if (err) {
        logger.info('Storage Group Model: ' + err);
      } else if (storagegroup.length) {
        if (storagegroup.length > 1 || (storagegroup.length === 1 && storagegroup[0]._id.toString() !== self._id.toString())) {
          logger.info('Storage Group Model: Name not unique per Server');
          self.invalidate('name', 'Name has to be unique per Server');
        }
      }
      next();
    });
  }
});

StoragegroupSchema.index({ name: 1, server: 1 }, { unique: true });
StoragegroupSchema.index({ code: 1, server: 1 }, { unique: true });

StoragegroupSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.storagegroupId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Storagegroup', StoragegroupSchema);
