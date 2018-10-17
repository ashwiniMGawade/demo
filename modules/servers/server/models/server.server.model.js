'use strict';

/**
 * Module dependencies.
 */
var  _ = require('lodash'),
     mongoose = require('mongoose'),
     path = require('path'),
     logger = require(path.resolve('./config/lib/log')),
     Schema = mongoose.Schema;

 /**
  * A Validation function for checking is cifs enabled
  */
 var isCIFSEnabled = function () {
   return this.cifs;
 };

/**
 * Server Schema
 */
var ServerSchema = new Schema({
  name: {
    type: String,
    required: 'Server name required',
    trim: true,
    minlength: [ 3, 'Server name, Minimum 3 char required'],
    maxlength: [ 64, 'Server name, Maximum 64 char allowed'],
    match: [ /^[a-zA-Z0-9\ -]*$/ , 'Server name can only include alphanumeric, space & dash']
  },
  code: {
    type: String,
    trim: true,
    match: [ /^[a-zA-Z0-9\-_]*$/ , 'Server code can only include alphanumeric, underscore & dash']
  },
  site: {
    type: Schema.ObjectId,
    ref: 'Site',
    required: 'Server site required'
  },
  pod: {
    type: Schema.ObjectId,
    ref: 'Pod'
  },
  tenant: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  partner: {
    type: Schema.ObjectId,
    ref: 'Tenant'
  },
  subtenant: {
    type: Schema.ObjectId,
    ref: 'Subtenant',
    required: 'Server subtenant required'
  },
  subscription: {
    type: Schema.ObjectId,
    ref: 'Subscription',
    required: 'Server subscription required'
  },
  managed: {
    type: String,
    enum: {
            values: ['Portal', 'Customer'],
            message: '`{VALUE}` not a valid value for managed'
          },
    required: 'Server managed type required'
  },
  vlan: {
    type: String,
    default: 0,
    trim: true,
    validate : {
      validator : function(value) {         
        if(Number(value)) {
          return Number.isInteger(Number(value));
        } else {
          return true;
        }
      },
      message   : '{VALUE} is not an integer value for VLAN'
    }
  },
  subnet: {
    type: String,
    required: 'Server subnet required',
    trim: true,
    match: [ /^(([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){2}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([8-9]|1[0-9]|2[0-6]))$/ ,
             'Subnet should be of CIDR notation']
    //Follows Subnet-CIDR notation
    //Must end with “/8-26”
    //Last octet must be “0”, ”64”, ”128” or “192”
    //First, Second & Third octets must be between “1” & “255” inclusively
  },
  status: {
    type: String,
    default: 'Creating',
    enum: {
            values: ['Creating', 'Updating', 'Deleting', 'Operational', 'Contact Support'],
            message: '`{VALUE}` not a valid value for Status'
          }
  },
  gateway: {
    type: String,
    default: '',
    trim: true,
    match: [ /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/ ,
             'Gateway should be a valid IP']
  },
  ipVirtClus: {
    type: String,
    default: '',
    trim: true,
    match:[/^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/, 
    'Cluster IP should be a valid IP']
  },
  ipMgmt: {
    type: String,
    default: '',
    trim: true,
    match:[/^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/, 
    'Primary IP should be a valid IP']
  },
  ipsSan: {
    type: String,
    default: '',
    trim: true
  },
  ipsIcl: {
    type: String,
    trim: true
  },
  nfs: {
    type: Boolean,
    default: false
  },
  cifs: {
    type: Boolean,
    default: false
  },
  cifsDnsDomain: {
    type: String,
    default: null,
    minlength: [ 2, 'CIFS DNS Domain, Minimum 2 char required'],
    maxlength: [ 64, 'CIFS DNS Domain, Maximum 64 char allowed'],
    required: [ isCIFSEnabled, 'CifsDnsDomain is required' ],
    trim: true,
    match: [ /^[a-z0-9.-]*$/ , 'CIFS DNS Domain can only include alphanumeric (lowercase), dots & dash' ]
  },
  cifsDnsServers: {
    type: String,
    default: null,
    maxlength: [ 64, 'CIFS DNS Servers, Maximum 64 char allowed'],
    required: [ isCIFSEnabled, 'CifsDnsServers is required' ],
    trim: true,
    match: [ /^[0-9.,]*$/ , 'CIFS DNS Servers can only be IP Addresses and commas are allowed (no spaces)' ]
  },
  cifsServername: {
    type: String,
    default: null,
    minlength: [ 2, 'CIFS Server Name, Minimum 2 char required'],
    maxlength: [ 15, 'CIFS Server Name, Maximum 15 char allowed'],
    required: [ isCIFSEnabled, 'CifsServername is required' ],
    trim: true,
    match: [ /^[a-z0-9-]*$/ , 'CIFS Servername can only include alphanumeric (lowercase) & dash' ]
  },
  cifsDomain: {
    type: String,
    default: null,
    minlength: [ 2, 'CIFS Domain, Minimum 2 char required'],
    maxlength: [ 64, 'CIFS Domain, Maximum 64 char allowed'],
    required: [ isCIFSEnabled, 'CifsDomain is required' ],
    trim: true,
    match: [ /^[a-z0-9.-]*$/ , 'CIFS Domain can only include alphanumeric (lowercase), dots & dash' ]
  },
  cifsOu: {
    type: String,
    default: '',
    trim: true
  },
  cifsSite: {
    type: String,
    default: '',
    trim: true
  },
  iscsi: {
    type: Boolean,
    default: false
  },
  iscsiAlias: {
    type: String,
    default: null,
    minlength: [ 3, 'iSCSI Alias, Minimum 3 char required'],
    maxlength: [ 32, 'iSCSI Alias, Maximum 32 char allowed'],
    trim: true,
    match: [ /^[a-z0-9.-]*$/ , 'iSCSI Alias can only include alphanumeric (lowercase) characters, dashes and dots' ]
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
 * Hook a pre validate method to test for a valid subtenant & site
 */
ServerSchema.pre('validate', function (next) {
  var self = this;

  if (self.subtenant) {
    var subtenant_id = (self.subtenant._id) ? mongoose.Types.ObjectId(self.subtenant._id) : self.subtenant;
    mongoose.model('Subtenant').findById(subtenant_id).exec(function (err, subtenant) {
      if (err) {
        invalidateAndLog(err, 'subtenant', 'Invalid Subtenant ID');
      } else if (!subtenant) {
        invalidateAndLog('Invalid Subtenant ID', 'subtenant', 'Invalid Subtenant ID');
      } else if ( self.user && self.user.tenant && !(_.isEqual(subtenant.tenant, self.user.tenant) || _.isEqual(subtenant.tenant, self.user.tenant._id)) ) {
        invalidateAndLog('Subtenant belongs to different Tenant', 'subtenant', 'Invalid Subtenant ID');
        } else {
        self.tenant = subtenant.tenant;
        mongoose.model('Server').find({name: new RegExp('^'+ self.name + '$', "i"), tenant: self.tenant}).exec(function (err, server) {
          if (err) {
            logger.info('Server Model: ' + err);
          } else if (server.length) {
            if (server.length > 1 || (server.length === 1 && server[0]._id.toString() !== self._id.toString())) {
              self.invalidate('name', 'Name has to be unique');
            }
          }
        });
      }
      if (self.site) {
        var site_id = (self.site._id) ? mongoose.Types.ObjectId(self.site._id) : self.site;
        mongoose.model('Site').findById(site_id).exec(function (err, site) {
          if (err) {
            invalidateAndLog(err, 'site', 'Invalid Site ID');
            next();
          } else if (!site) {
            invalidateAndLog('Invalid Site ID', 'site', 'Invalid Site ID');
            next();
          } else {
            if (self.subscription) {
              var subscription_id = (self.subscription._id) ? mongoose.Types.ObjectId(self.subscription._id) : self.subscription;
              mongoose.model('Subscription').findById(subscription_id).exec(function (err, subscription) {               
                if (err) {
                  invalidateAndLog(err, 'subscription', 'Invalid Subscription ID');
                } else if (!subscription) {
                  invalidateAndLog('Invalid Subscription ID', 'subscription', 'Invalid Subscription ID');
                } else if ( self.user && self.user.tenant && !(_.isEqual(subscription.tenant, self.user.tenant) || (self.user.tenant._id && _.isEqual(subscription.tenant, self.user.tenant._id))) ) {
                  invalidateAndLog('Subscription belongs to different Tenant checked user.tenant', 'subscription', 'Invalid Subscription ID');
                } else if (self.tenant && !(_.isEqual(subscription.tenant, self.tenant) || (self.tenant._id && _.isEqual(subscription.tenant, self.tenant._id)))) {
                  invalidateAndLog('Subscription belongs to different Tenant', 'subscription', 'Invalid Subscription ID');
                } else if (subscription.site && self.site && !(_.isEqual(subscription.site, self.site) || (self.site._id && _.isEqual(subscription.site, self.site._id)))) {
                  invalidateAndLog('Subscription belongs to different Site', 'subscription', 'Invalid Subscription ID');
                } else {                 
                  self.partner = subscription.partner;                  
                }               
                next();
              });
            } else {
              next();
            }
          }
        });
      } else {
        next();
      }
    });
  } else {
    next();
  }

  function invalidateAndLog(logMessage, invalidateField, InvalidateMsg) {
    logger.info('Server Model: ' + logMessage);
    self.invalidate(invalidateField, InvalidateMsg);
  }
});

ServerSchema.index({ name: 1, tenant: 1 }, { unique: true });

ServerSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.serverId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj.vlan;
  delete obj.pod;
  delete obj._id;
  delete obj.__v;
  if (obj.managed === "Customer") {
    delete obj.iscsiAlias;
    delete obj.iscsi;
    delete obj.cifsSite;
    delete obj.cifsOu;
    delete obj.cifsDomain;
    delete obj.cifsServername;
    delete obj.cifsDnsServers;
    delete obj.cifsDnsDomain;
    delete obj.cifs;
    delete obj.nfs;
    delete obj.ipsSan;
  } else if (obj.managed === "Portal") {
    delete obj.ipVirtClus;
  }
  return obj;
};

mongoose.model('Server', ServerSchema);
