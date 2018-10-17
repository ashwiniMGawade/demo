'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  Schema = mongoose.Schema;

/**
 * Icr Schema
 */
var IcrSchema = new Schema({
  message: {
    type: String,
    default: '',
    trim: true,
    required: 'Message required',
    minlength: [3, 'Message: min 3 chars required'],
    maxlength: [1024, 'Message: Maximum 1024 chars allowed'],
    match: [ /^[a-zA-Z0-9_ .,-]*$/ , 'Message can only include alphanumeric, space, dash, underscore, comma & dot']
  },
  clusterExt: {
    type: String,
    default: '',
    required: 'Cluster text required',
    trim: true,
    maxlength: [64, 'Cluster Text: Maximum 64 char allowed'],
    match: [ /^[a-zA-Z0-9_ -]*$/ , 'ICM cluster text can only include alphanumeric, space, dash & underscore']
  },
  ipsExt: {
    type: String,
    default: '',
    required: 'External IP addresses required',
    trim: true,
    maxlength: [128, 'External IP addresses: Maximum 128 char allowed'],
    match: [ /^\*$|^(?:\d|1?\d\d|2[0-4]\d|25[0-5])(?:\.(?:\d|1?\d\d|2[0-4]\d|25[0-5])){3}(?:\s*,\s*(?:\d|1?\d\d|2[0-4]\d|25[0-5])(?:\.(?:\d|1?\d\d|2[0-4]\d|25[0-5])){3})*$/ , 'Invalid External IP addresses']
  },
  server: {
    type: Schema.ObjectId,
    ref: 'Server',
    required: 'vFAS required'
  },
  tenant: {
    type: Schema.ObjectId,
    ref: 'Tenant',
    required: 'Tenant required'
  },
  partner: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  subtenant: {
    type: Schema.ObjectId,
    ref: 'Subtenant'
  },
  status: {
    type:String,
    default:'Creating',
    enum: {
      values: ['Creating', 'Operational', 'Accept-Pending', 'Network-Pending', 'Closed', 'Deleting', 'Updating'],
      message:'`{VALUE}` not a valid value for status'
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
 * Hook a pre save method to set the subtenant
 */
IcrSchema.pre('save', function (next, done) {
  if (!this.isNew) {
    next();
  } else {
    var self = this;

    mongoose.model('Server').findById(self.server).exec(function (err, server) {
      if (err) {
        logger.info('Server Model: ' + err);
      } else if (!server) {
        logger.info('Server Model: Invalid ServerID');
      } else {       
        self.subtenant = server.subtenant;
        self.partner = server.partner;
      }
      next();
    });
  }
});


/**
 * Hook a pre validate method to validate the Tenant
 */
IcrSchema.pre('validate', function (next, done) { 
  var self = this;
  //Check for valid tenant
  if (self.tenant) {

    mongoose.model('Tenant').findById(self.tenant).exec(function (err, tenant) {

      if (err) {
        console.log('Icr Model: ' + err);
        self.invalidate('tenant', 'Invalid Tenant ID');
        next();
      } else if (!tenant) {
        console.log('Icr Model: Invalid Tenant ID');
        self.invalidate('tenant', 'Invalid Tenant ID');
        next();
      } else {
        if (self.server) {
          mongoose.model('Server').findById(self.server).exec(function (err, server) {
            if (err) {
              console.log('Icr Model: ' + err);
              self.invalidate('server', 'Invalid Server ID');
            } else if (!server) { 
              console.log('Icr Model: Invalid Server ID');
              self.invalidate('server', 'Invalid Server ID');
            } else if(server.managed === 'Portal') { 
              console.log('Icr Model: Server is Portal managed');
              self.invalidate('server', 'Server is Portal managed');
            } else if (server.tenant.toString() !== tenant._id.toString()) {
              console.log('Icr Model: Invalid Server ID, Sever belongs to different tenant');
              self.invalidate('server', 'Invalid Server ID');
            }    
            next();
          });
        } else {
          next();
        }
      }
        
    });
  } else {
    next();
  }
});

IcrSchema.methods.toJSON = function () {
  var obj = this.toObject();
  obj.icrId = obj._id;
  delete obj.user;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Icr', IcrSchema);
