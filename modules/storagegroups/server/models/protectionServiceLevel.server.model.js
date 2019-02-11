'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * ProtectionServiceLevelSchema Schema
 */
var ProtectionServiceLevelSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    unique: true,
    required: 'ProtectionServiceLevel name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: [/^[a-zA-Z0-9\-]*$/, 'ProtectionServiceLevel name can only include alphanumeric characters including dash']   
  },  
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  },
  has_mirror:{
    type:Boolean,
    default:false
  },
  has_vault:{
    type:Boolean,
    default:false
  },
  mirror_vault_cascade:{
    type:Boolean,
    default:false
  },
  primary_volume_defaults: {
    percentage_snapshot_reserve: Number
  }
}, { collection: 'protection_service_levels' });


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

mongoose.model('protectionServiceLevel', ProtectionServiceLevelSchema);
