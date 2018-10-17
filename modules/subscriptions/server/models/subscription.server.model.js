'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    path = require('path'),
    featuresSettings = require(path.resolve('./config/features')),
    logger = require(path.resolve('./config/lib/log')),
    Schema = mongoose.Schema;

/**
 * Subscription Schema
 */
var SubscriptionSchema = new Schema({
  name: {
    type: String,
    trim: true,
    minlength: [ 3, 'Subscription Name should be minimum 3 char'],
    maxlength: [ 32, 'Subscription Name can only be maximum 32 char'],
    match: [ /^[a-zA-Z0-9\ -]*$/ , 'Subscription name can only include alphanumeric, space & dash'],
    required: 'Subscription Name required'
  },
  code: {
    type: String,
    trim: true,
    minlength: [ 3, 'Subscription Code should be minimum 3 char'],
    maxlength: [ 16, 'Subscription Code can only be maximum 16 char'],
    match: [ /^[a-z0-9]*$/ , 'Subscription code can only include lowercase alphanumeric characters'],
    required: 'Subscription Code required'
  },
  tenant: {
    type: Schema.ObjectId,
    ref: 'Tenant',
    required: 'Subscription Tenant required'
  },
  partner: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  site: {
    type: Schema.ObjectId,
    ref: 'Site',
    required: [(featuresSettings.subscription.site.enabled && featuresSettings.subscription.site.mandatory) ? true: false, 'Subscription Site required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [ 256, 'Subscription description can only be maximum 256 char'],
    match: [ /^[a-zA-Z0-9\ ,-._]*$/ , 'Subscription description can only include alphanumeric, space, dash, underscore, comma & dot'],
    required: [(featuresSettings.subscription.description.enabled && featuresSettings.subscription.description.mandatory) ? true: false, 'Subscription description required']
  },
  url: {
    type: String,
    trim: true,
    maxlength: [ 256, 'Subscription URL can only be maximum 256 char'],
    match: [ /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i , 'Subscription URL must be in URL format'],
    required: [(featuresSettings.subscription.url.enabled && featuresSettings.subscription.url.mandatory) ? true: false, 'Subscription URL required']
  },
  storagePack  : [{
    _id : false,
    class : {
      type: String,
      required: 'Storage pack class required',
      enum: {
        values: ['ontap-standard', 'ontap-premium', 'ontap-performance'],
        message: '`{VALUE}` not a valid value for class'
      }
    },
    sizegb: {
      'procured' : {
        type: Number,
        trim: true,
        min: [0, 'Storage procured size should not be negative'],
        required: 'Storage pack size required',
        validate : {
          validator : Number.isInteger,
          message   : '{VALUE} is not an integer value for size'
        }
      },
      'available' : {
        type: Number,
        min: [0, 'Storage available size should not be negative'],  
        validate : {
          validator : Number.isInteger,
          message   : '{VALUE} is not an integer value for size'
        }
      }
    }
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


SubscriptionSchema.pre('validate', function (next) {
  var self = this; 

  if (featuresSettings.paymentMethod.prePaid) {
    if (typeof self.storagePack === "undefined" || !self.storagePack || !self.storagePack.length) {      
      invalidate_and_Log('storagePack', 'Storage pack required', 'Storage pack required');
    } else {
      _.forEach(self.storagePack, function(value, key) {
        if (value.class) {
          var classElements = _.filter(self.storagePack, {'class' : value.class});        
          if (classElements && classElements.length > 1) {
            invalidate_and_Log(
              'storagePack',
              'Storage pack class ' + value.class + ' already exist.' ,
              'Storage pack class ' + value.class + ' already exist.'
            );
          } else if(self.isNew) {
            self.storagePack[key].sizegb.available = value.sizegb.procured;
          }
        }        
      });     
    }    
  }

  if (self.tenant) {
    mongoose.model('Tenant').findById(self.tenant).exec(function (err, tenant) {
      if (err) {
        invalidate_and_Log('tenant', 'Invalid Tenant ID', err);
      } else if (!tenant) {
        invalidate_and_Log('tenant', 'Invalid Tenant ID');
      }
      validateSite();
    });
  } else {
    next();
  }

  function validateSite() {
    if (self.isNew && self.site) {
      mongoose.model('Site').findById(self.site).exec(function (err, site) {
        if (err) {
          invalidate_and_Log('site', 'Invalid Site ID', err);
        } else if (!site) {
          invalidate_and_Log('site', 'Invalid Site ID');
        } else {
          validatePartner();
        }
      });
    } else {
      validatePartner();
    }
  }

  function validatePartner() {
    if (self.isNew && self.partner) {
      mongoose.model('Tenant').findById(self.partner).exec(function (err, partner) {
        if (err) {
          invalidate_and_Log('partner', 'Invalid Partner ID', err);
        } else if (!partner) {
          invalidate_and_Log('partner', 'Invalid Partner ID');
        } else {
          validateNameAndCode();
        }
      });
    } else {
      validateNameAndCode();
    }
  }

  function validateNameAndCode() {
    mongoose.model('Subscription')
    .find({name: new RegExp('^'+ self.name + '$', "i"), tenant: self.tenant})
    .exec(function (err, subscription) {
      if (err) {
        invalidate_and_Log('name', err);
      } else if(subscription.length) {
        if(subscription.length > 1 || (subscription.length === 1 && subscription[0]._id.toString() !== self._id.toString())) {
          invalidate_and_Log('name', 'Name has to be unique per tenant');
        }
      }
      mongoose.model('Subscription')
      .find({code: new RegExp('^'+ self.code + '$', "i")})
      .exec(function (err, subscription) {
        if (err) {
          invalidate_and_Log('code', err);
        } else if(subscription.length) {
          if(subscription.length > 1 || (subscription.length === 1 && subscription[0]._id.toString() !== self._id.toString())) {
            invalidate_and_Log('code', 'Code has to be unique');
          }
        }
        next();
      });
    });
  }
  function invalidate_and_Log(field, invalidateMsg, logMsg){
    self.invalidate(field, invalidateMsg);
    logger.info('Subscription Model: ' + (logMsg ? logMsg : invalidateMsg));
    next();
  }
});

SubscriptionSchema.index({ name: 1, tenant: 1 }, { unique: true });

SubscriptionSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.subscriptionId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  if (!featuresSettings.paymentMethod.prePaid) {
    delete obj.storagePack;
  }
  return obj;
};

mongoose.model('Subscription', SubscriptionSchema);
