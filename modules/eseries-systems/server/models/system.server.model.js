'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * System Schema
 */

var storagePoolSchema = new Schema ({
  name: {
    type: String
  },
  available_size: {
    type: Number
  },
  used_percentage: {
    type: Number
  },
  offline: {
    type: Boolean
  },
  raid_level: {
    type: String
  },
  raid_status: {
    type: String
  },
})

var hostTypeSchema = new Schema ({
  name: {
    type: String
  },
  code: {
    type: String
  },
  index: {
    type: Number
  },  
})
var SystemSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    unique: true,
    required: 'System name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: [/^[a-zA-Z0-9\-_]*$/, 'System name can only include alphanumeric characters including dash and underscore']   
  },
  ssid: {
    type: String,
    trim: true
  },
  storage_pool: [storagePoolSchema],
  host_type: [hostTypeSchema],
  wwn: {
    type: String,
    trim:true,
    unique:true,
    required: 'System WWN is required',
    // match:[/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, 'System UUID is not in proper format']
  },
  rest_url_ip: {
    type: String,
    default: '',
    trim: true,
    required: 'REST URL is required',
    match: [ /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+(\/[a-zA-z0-9]*)*$/ , 'REST URL must be in valid format'],
  },
  provisioning_state: {
    type: String,
    default: 'closed',
    required: 'Provisioning state is required',
    enum: {
            values: ['open', 'closed'],
            message: '`{VALUE}` not a valid value for Provisioning State'
          }
  }, 
  applications:[{
    type: Schema.ObjectId,
    ref: 'Application'
  }], 
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  }
});

SystemSchema.pre('save', function (next) {
  var self = this;
  // self.apis_system_key = self.uuid + ":type=system,uuid="+ self.uuid;
  next();
});

SystemSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.systemId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

SystemSchema.statics.findByName = function (name, callback) {
  return this.find({ name: name }, callback);
};

mongoose.model('eseries_systems', SystemSchema);
