'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator'),
    path = require('path'),
    logger = require(path.resolve('./config/lib/log')),
    Schema = mongoose.Schema;

/**
 * Subtenant Schema
 */
var SubtenantSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    required: 'Subtenant name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: [/^[a-zA-Z0-9\ -]*$/, 'Subtenant name can only include alphanumeric characters including space and dash']
  },
  code: {
    type: String,
    trim: true,
    required: 'Subtenant code required',
    minlength: [3, 'Code: Minimum 3 char required'],
    maxlength: [8, 'Code: Maximum 8 char allowed'],
    match: [ /^[a-z0-9]*$/ , 'Subtenant code can only include lowercase alphanumeric characters']
  },
  tenant: {
    type: Schema.ObjectId,
    ref: 'Tenant',
    required: 'Tenant required'
  },
  partner: {
    type: Schema.ObjectId,
    ref: 'Tenant',
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
 * Hook a pre save method to validate the Tenant
 */
SubtenantSchema.pre('save', function (next, done) {
  if (!this.isNew) {
    next();
  } else {
    var self = this;
    //Check for valid tenant
    if (self.tenant) {
      mongoose.model('Tenant').findById(self.tenant).exec(function (err, tenant) {
        if (err) {
          logger.info('Subtenant Model: ' + err);
        } else if (!tenant) {
          logger.info('Subtenant Model: Invalid Tenant ID');
        } else {
          self.partner = tenant.partner;
        }
        next();
      });
    } else {
      next();
    }
  }
});

/**
 * Hook a pre validate method to test unique record
 */
SubtenantSchema.pre('validate', function (next) {
  var self = this;
  mongoose.model('Subtenant').find({name: new RegExp('^'+ self.name + '$', "i"), tenant: self.tenant}).exec(function (err, subtenant) {
    if (err) {
      logger.info('Subtenant Model: ' + err);
    } else if(subtenant.length) {
      if(subtenant.length > 1 || (subtenant[0]._id.toString() !== self._id.toString() && subtenant.length === 1)) {
        self.invalidate('subtenant', 'Name and Code has to be unique.');
      }
    }    
    next();
  });
});

// SubtenantSchema.index({ name: 1, tenant: 1 }, { unique: true });
// SubtenantSchema.index({ code: 1, tenant: 1 }, { unique: true });

SubtenantSchema.plugin(uniqueValidator, { message: 'Name and Code has to be unique.' });

SubtenantSchema.methods.toJSON = function () {
  var obj = this.toObject();
  obj.subtenantId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Subtenant', SubtenantSchema);
