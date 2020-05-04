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
 * Application Schema
 */
var ApplicationSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    required: 'Application name required',
    minlength: [3, 'Name: Minimum 3 char required'],
    maxlength: [64, 'Name: Maximum 64 char allowed'],
    match: /^[a-zA-Z0-9\ -]*$/
  },
  code: {
    type: String,
    trim: true,
    unique: true,
    required: 'Application code required',
    minlength: [3, 'Code: Minimum 3 char required'],
    maxlength: [16, 'Code: Maximum 16 char allowed'],
    match: [ /^[a-z0-9]*$/ , 'Application code can only include lowercase alphanumeric characters']
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
 * Hook a pre validate method to test for a valid application
 */
ApplicationSchema.pre('validate', function (next) {
  var self = this;
  if (self.isNew && self.partner) {
    mongoose.model('Application').find({'_id' : self.partner}).exec(function (err, partner) {      
      if (err) {
        logger.info('Application Model: ' + err);
        self.invalidate('partner', 'Invalid Partner ID');
        next();
      } else if (!partner.length) {        
        logger.info('Application Model: Invalid Partner ID');
        self.invalidate('partner', 'Invalid Partner ID');
        next();
      } 
    });
  }

  mongoose.model('Application').find({name: new RegExp('^'+ self.name + '$', "i"), application: self.application}).exec(function (err, application) {
    if (err) {
      logger.info('Application Model: ' + err);
    } else if(application.length) {
      if(application.length > 1 || (application.length === 1 && application[0]._id.toString() !== self._id.toString())) {
        self.invalidate('name', 'Application name has to be unique');
      }
    }
    next();
  });

});

ApplicationSchema.methods.toJSON = function () {
  var obj = this.toObject();
  obj.applicationId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Application', ApplicationSchema);
