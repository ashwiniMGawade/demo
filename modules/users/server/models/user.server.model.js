'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test'),  
  featuresSettings = require(path.resolve('./config/features')),
  _ = require('lodash');

/**
 * User Schema
 */
var UserSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    default: '',
    required: 'First name required',
    maxlength: [64, 'First name is longer than the maximum allowed length (64).'],
    minlength: [2, 'First name is shorter than the minimum allowed length (2).'],
    match: [ /^[a-zA-Z\ -]*$/ , 'First name can only include alphabetical, space & dash']
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    required: 'Last name required',
    maxlength: [64, 'Last name is longer than the maximum allowed length (64).'],
    minlength: [2, 'Last name is shorter than the minimum allowed length (2).'],
    match: [ /^[a-zA-Z\ -]*$/ , 'Last name can only include alphabetical, space & dash']
  },
  displayName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    required: 'Email is required',
    trim: true,
    default: '',
    validate: [validator.isEmail, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    match: [ /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/ , 'Please fill a valid Phone number']
  },
  username: {
    type: String,
    unique: 'Username already exists',
    lowercase: true,
    trim: true,
    match: [ /^[a-z0-9\-]{3,32}$/ , 'Username can only include alphanumeric(lowercase) including - & must be 3-32 characters']
  },
  password: {
    type: String,
    default: 'Qwerty1234%' //<TODO> To be removed before prod release
  },
  salt: {
    type: String
  },
  profileImageURL: {
    type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  provider: {
    type: String,
    enum: {
      values: featuresSettings.tenant.providers.allowed,
      message: '`{VALUE}` not a valid value for Provider'
    },
    required: 'Provider is required'
  },
  providerData: {},
  additionalProvidersData: {},
  roles: {
    type: [{
      type: String,
      enum: ['read', 'user', 'admin', 'partner', 'root', 'l1ops']
    }],
    default: ['user'],
    required: 'Please provide at least one role'
  },
  tenant: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  partner: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  updated: {
    type: Date
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  },
  /* For reset password */
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  acceptTC: {
    type: Boolean,
    default: false
  },
});

/**
 * Hook a pre save method to hash the password & validate the Tenant
 */
UserSchema.pre('save', function (next) {

  var self = this;
  if (self.password && self.isModified('password')) {
    self.salt = crypto.randomBytes(16).toString('base64');
    self.password = self.hashPassword(self.password);
  }

  //Display name is always firstname + lastname
  self.displayName = self.firstName + ' ' + self.lastName;

 // tenant should be null only for root user l1ops user, Partner user  can have tenant API doc 0.35
  if (_.includes(self.roles, 'root') || _.includes(self.roles, 'partner') || _.includes(self.roles, 'l1ops')) {    
    self.provider = 'local';
    if (_.includes(self.roles, 'root') || _.includes(self.roles, 'l1ops')) {
      self.tenant = null;
    }
  }

  // if(self.isNew && self.provider !== 'local'){
  //   untilUniqueUserName();
  // }else{
  //   next();
  // }
  next();

  //Generate unique username
  function untilUniqueUserName(){
    var charOnlyFirstName = _.replace(_.replace(self.firstName,' ',''),'-','');
    var charOnlyLastName = _.replace(_.replace(self.lastName,' ',''),'-','');
    self.username = 'dfaas'+charOnlyFirstName[0]+charOnlyLastName.substr(0,6)+_.padStart(_.random(0, 999),3,'0');
    mongoose.model('User').find({ username: self.username }).exec(function (err, docs) {
        if (!docs.length) {
          next();
        }else{
          self.username = 'dfaas'+charOnlyFirstName[0]+charOnlyLastName.substr(0,6)+_.padStart(_.random(0, 999),3,'0');
          untilUniqueUserName();
        }
    });
  }

});

/**
 * Hook a pre validate method to test the local password
 */
UserSchema.pre('validate', function (next) {
  var self = this;

  if (self.provider==='local') {
    if(self.password && self.isModified('password')){
      var result = owasp.test(self.password);
      if (result.errors.length) {
        var error = result.errors.join(' ');
        self.invalidate('password', error);
      }
    }
    self.providerData = {};
  }else{
    self.password = '';
  }

  if( _.includes(self.roles, 'root') || _.includes(self.roles, 'l1ops')){
    self.tenant = null;
  }

  //For Partner, Admin, Read, User - tenant is mandatory
  if ((_.includes(self.roles, 'partner') || _.includes(self.roles, 'admin') ||
       _.includes(self.roles, 'user') || _.includes(self.roles, 'read')) && !self.tenant) {
    logger.info('User Model: Tenant is required');
    self.invalidate('tenant', 'Tenant field is required.'); 
    next();  
  }

  if (self.isNew) {
    if(self.tenant){     
      mongoose.model('Tenant').findById(self.tenant).exec(function (err, tenant) {
        if (err) {
          logger.info('User Model: ' + err);
          self.invalidate('tenant', 'Invalid Tenant ID');
        } else if (!tenant) {
          logger.info('User Model: Invalid Tenant ID');
          self.invalidate('tenant', 'Invalid Tenant ID');
        }       
        //initialize partner for user as it's tenant partner
        if (tenant && self.tenant && tenant.partner) {
          self.partner = tenant.partner;
        }
        checkUniqueProviderCode();
      });
    }else{
      checkUniqueProviderCode();
    }
  } else if (!self.isNew) {
    mongoose.model('User').findById(self._id).exec(function (err, user) {
      if (err) {
        logger.info('User Model: ' + err);
      } else if(user) {      
        if ((_.includes(user.roles, 'root') || _.includes(user.roles, 'partner')) && (_.includes(self.roles, 'admin') || _.includes(self.roles, 'user') || _.includes(self.roles, 'read'))) {
          self.invalidate('user', 'Role could not be change from ' + user.roles.join() +' to ' + self.roles.join());
        } else if ((_.includes(user.roles, 'admin') || _.includes(user.roles, 'user') || _.includes(user.roles, 'read')) && (_.includes(self.roles, 'root') || _.includes(self.roles, 'partner'))) {
          self.invalidate('user', 'Role could not be change from ' + user.roles.join() +' to ' + self.roles.join());
        } else if((_.includes(user.roles, 'partner') || _.includes(user.roles, 'admin') || _.includes(user.roles, 'user') || _.includes(user.roles, 'read')) && _.includes(self.roles, 'l1ops')) {
          self.invalidate('user', 'Role could not be change from ' + user.roles.join() +' to ' + self.roles.join());
        }
      }
      next();
    });
  } else {
    next();
  }

  function checkUniqueProviderCode(){
    if(self.provider && !_.isEmpty(self.providerData) && self.providerData.code){
      mongoose.model('User').find({ 'providerData' : { 'code' : self.providerData.code },
                                    'provider' : self.provider }).exec(function (err, docs) {
          if (docs.length) {
            logger.info('User Model: Duplicate Provider Code');
            self.invalidate('providerCode', 'Duplicate Provider Code');
          }
        next();
      });
    }else{
      next();
    }
  }
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {    
    return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64, 'sha512').toString('base64');
  } else {
    return password;
  }
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password) {
  return this.password === this.hashPassword(password);
};

UserSchema.methods.toJSON = function () {
  var obj = this.toObject();
  obj.userId = obj._id;
  delete obj.user;
  delete obj.updated;
  delete obj.created;
  delete obj._id;
  delete obj.__v;
  delete obj.salt;
  delete obj.password;
  return obj;
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
  var _this = this;
  var possibleUsername = username.toLowerCase() + (suffix || '');

  _this.findOne({
    username: possibleUsername
  }, function (err, user) {
    if (!err) {
      if (!user) {
        return callback(possibleUsername);
      } else {
        return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Generates a random passphrase that passes the owasp test.
 * Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
 * NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
 */
UserSchema.statics.generateRandomPassphrase = function () {
  return new Promise(function (resolve, reject) {
    var password = '';
    var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

    // iterate until the we have a valid passphrase.
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present.
    while (password.length < 20 || repeatingCharacters.test(password)) {
      // build the random password
      password = generatePassword.generate({
        length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true,
      });

      // check if we need to remove any repeating characters.
      password = password.replace(repeatingCharacters, '');
    }

    // Send the rejection back if the passphrase fails to pass the strength test
    if (owasp.test(password).errors.length) {
      reject(new Error('An unexpected problem occured while generating the random passphrase'));
    } else {
      // resolve with the validated passphrase
      resolve(password);
    }
  });
};

mongoose.model('User', UserSchema);
