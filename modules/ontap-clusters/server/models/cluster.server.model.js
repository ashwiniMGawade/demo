'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Cluster Schema
 */

var aggregateSchema = new Schema ({
  name: {
    type: String
  },
  available_size: {
    type: Number
  },
  used_percentage: {
    type: Number
  },
  total_commited: {
    type: Number
  }
})
var ClusterSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    unique: true,
    required: 'Cluster name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: [/^[a-zA-Z0-9\-_]*$/, 'Cluster name can only include alphanumeric characters including dash and underscore']   
  },
  apis_cluster_key: {
    type: String,
    trim: true
  },
  aggregates: [aggregateSchema],
  dr_enabled: {
    type: Boolean,
    default: false
  },
  uuid: {
    type: String,
    trim:true,
    unique:true,
    required: 'Cluster UUID is required',
    match:[/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, 'Cluster UUID is not in proper format']
  },
  management_ip: {
    type: String,
    default: '',
    trim: true,
    required: 'Management IP is required',
    match: [ /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/ ,
             'Management IP should be a valid IP']
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
  }
});

ClusterSchema.pre('save', function (next) {
  var self = this;
  self.apis_cluster_key = self.uuid + ":type=cluster,uuid="+ self.uuid;
  next();
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

ClusterSchema.statics.findByName = function (name, callback) {
  return this.find({ name: name }, callback);
};

mongoose.model('ontap_clusters', ClusterSchema);
