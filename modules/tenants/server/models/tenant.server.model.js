'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  featuresSettings = require(path.resolve('./config/features')),
  Schema = mongoose.Schema;

/**
 * Tenant Schema
 */
var TenantSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    required: 'Tenant name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: /^[a-zA-Z0-9\ -]*$/
  },
  code: {
    type: String,
    trim: true,
    unique: true,
    required: 'Tenant code required',
    minlength: [3, 'Code: Minimum 3 char required'],
    maxlength: [8, 'Code: Maximum 8 char allowed'],
    match: [ /^[a-z0-9]*$/ , 'Tenant code can only include lowercase alphanumeric characters']
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  partner: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  annotation: {
    type: String,
    trim: true,
    required:[(featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) ? true: false, 'Annotation required'],
    maxlength: [32, 'Annotation: Maximum 32 char allowed'],
    match: [/^[a-zA-Z0-9\-]*$/, 'Annotation: Only alphanumeric characters and dashes are allowed']
  },
  created: {
    type: Date,
    default: Date.now
  }
});


/**
 * Hook a pre validate method to test for a valid tenant
 */
TenantSchema.pre('validate', function (next) {
  var self = this;
  if (self.isNew && self.partner) {
    mongoose.model('Tenant').find({'_id' : self.partner}).exec(function (err, partner) {      
      if (err) {
        logger.info('Tenant Model: ' + err);
        self.invalidate('partner', 'Invalid Partner ID');
        next();
      } else if (!partner.length) {        
        logger.info('Tenant Model: Invalid Partner ID');
        self.invalidate('partner', 'Invalid Partner ID');
        next();
      } 
    });
  }

  mongoose.model('Tenant').find({name: new RegExp('^'+ self.name + '$', "i"), tenant: self.tenant}).exec(function (err, tenant) {
    if (err) {
      logger.info('Tenant Model: ' + err);
    } else if(tenant.length) {
      if(tenant.length > 1 || (tenant.length === 1 && tenant[0]._id.toString() !== self._id.toString())) {
        self.invalidate('name', 'Tenant name has to be unique');
      }
    }
    next();
  });

});

TenantSchema.methods.toJSON = function () {
  var obj = this.toObject();
  obj.tenantId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Tenant', TenantSchema);
