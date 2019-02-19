'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * PerformanceServiceLevelSchema Schema
 */
var PerformanceServiceLevelSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    unique: true,
    required: 'PerformanceServiceLevel name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: [/^[a-zA-Z0-9\-]*$/, 'PerformanceServiceLevel name can only include alphanumeric characters including dash']   
  },  
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  },
  aggregate_keys:[{
    type:String
  }],
  max_iops_per_tb: {
    type: Number
  }
}, { collection: 'servicelevel' });


// ServiceLevelSchema.methods.toJSON = function() {
//   var obj = this.toObject();
//   obj.ServiceLevelId = obj._id;
//   delete obj.user;
//   delete obj.created;
//   delete obj._id;
//   delete obj.__v;
//   return obj;
// };
//console.log(ServiceLevelSchema);

mongoose.model('performanceServiceLevel', PerformanceServiceLevelSchema);
