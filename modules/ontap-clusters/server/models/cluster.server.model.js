'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Cluster Schema
 */
var ClusterSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    unique: true,
    required: 'Cluster name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: [/^[a-zA-Z0-9\ -]*$/, 'Cluster name can only include alphanumeric characters including space and dash']   
  },
  key: {
    type: String,
    trim: true,
    unique: true,
    required: 'Cluster key required',
    minlength: [ 3, 'key: Minimum 3 char required'],
    maxlength: [ 32, 'key: Maximum 32 char allowed'],
    match: [ /^[a-z0-9]*$/ , 'Cluster key can only include lowercase alphanumeric characters']
  },
  management_ip: {
    type: String,
    default: '',
    trim: true,
    match: [ /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/ ,
             'Management IP should be a valid IP']
  },
  provisioning_state: {
    type: String,
    default: 'open',
    enum: {
            values: ['Open', 'Closed'],
            message: '`{VALUE}` not a valid value for Provisioning State'
          }
  }, 
  rest_uri: {
    type: String,
    default: ''
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

ClusterSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.clusterId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

ClusterSchema.statics.findByCode = function (code, callback) {
  return this.find({ code: code }, callback);
};

mongoose.model('ontap_clusters', ClusterSchema);
