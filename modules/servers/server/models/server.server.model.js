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
  // code: {
  //   type: String,
  //   trim: true,
  //   match: [ /^[a-zA-Z0-9\-_]*$/ , 'Server code can only include alphanumeric, underscore & dash']
  // },
  cluster: {
    type: Schema.ObjectId,
    ref: 'ontap_clusters',
    required: 'Server clusters required'
  },
  protocols: {
    type: String,
    required: 'Protocols are required',
    trim: true,
    match: [ /^[a-zA-Z]+(,[a-zA-Z]+)*$/ , 'Server name can only include coma seperated strings']
  },
  // pod: {
  //   type: Schema.ObjectId,
  //   ref: 'Pod'
  // },
  // tenant: {
  //   type: Schema.ObjectId,
  //   ref: 'Tenant'
  // },
  // partner: {
  //   type: Schema.ObjectId,
  //   ref: 'Tenant'
  // },
  // subtenant: {
  //   type: Schema.ObjectId,
  //   ref: 'Subtenant',
  //   required: 'Server subtenant required'
  // },
  // subscription: {
  //   type: Schema.ObjectId,
  //   ref: 'Subscription',
  //   required: 'Server subscription required'
  // }, 
  // vlan: {
  //   type: String,
  //   default: 0,
  //   trim: true,
  //   validate : {
  //     validator : function(value) {         
  //       if(Number(value)) {
  //         return Number.isInteger(Number(value));
  //       } else {
  //         return true;
  //       }
  //     },
  //     message   : '{VALUE} is not an integer value for VLAN'
  //   }
  // },
  // subnet: {
  //   type: String,
  //   required: 'Server subnet required',
  //   trim: true,
  //   match: [ /^(([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){2}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([8-9]|1[0-9]|2[0-6]))$/ ,
  //            'Subnet should be of CIDR notation']
  //   //Follows Subnet-CIDR notation
  //   //Must end with “/8-26”
  //   //Last octet must be “0”, ”64”, ”128” or “192”
  //   //First, Second & Third octets must be between “1” & “255” inclusively
  // },
  // status: {
  //   type: String,
  //   default: 'Creating',
  //   enum: {
  //           values: ['Creating', 'Updating', 'Deleting', 'Operational', 'Contact Support'],
  //           message: '`{VALUE}` not a valid value for Status'
  //         }
  // },
  // gateway: {
  //   type: String,
  //   default: '',
  //   trim: true,
  //   match: [ /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/ ,
  //            'Gateway should be a valid IP']
  // },
  // ipVirtClus: {
  //   type: String,
  //   default: '',
  //   trim: true,
  //   match:[/^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/, 
  //   'Cluster IP should be a valid IP']
  // },
  // ipMgmt: {
  //   type: String,
  //   default: '',
  //   trim: true,
  //   match:[/^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/, 
  //   'Primary IP should be a valid IP']
  // },
  // ipsSan: {
  //   type: String,
  //   default: '',
  //   trim: true
  // },
  // ipsIcl: {
  //   type: String,
  //   trim: true
  // },
  // nfs: {
  //   type: Boolean,
  //   default: false
  // },
  // cifs: {
  //   type: Boolean,
  //   default: false
  // },
  // cifsDnsDomain: {
  //   type: String,
  //   default: null,
  //   minlength: [ this.cifs ? 2: false, 'CIFS DNS Domain, Minimum 2 char required'],
  //   maxlength: [ 64, 'CIFS DNS Domain, Maximum 64 char allowed'],
  //   required: [ isCIFSEnabled, 'CifsDnsDomain is required' ],
  //   trim: true,
  //   match: [ /^[a-z0-9.-]*$/ , 'CIFS DNS Domain can only include alphanumeric (lowercase), dots & dash' ]
  // },
  // cifsDnsServers: {
  //   type: String,
  //   default: null,
  //   maxlength: [ 64, 'CIFS DNS Servers, Maximum 64 char allowed'],
  //   required: [ isCIFSEnabled, 'CifsDnsServers is required' ],
  //   trim: true,
  //   match: [ /^[0-9.,]*$/ , 'CIFS DNS Servers can only be IP Addresses and commas are allowed (no spaces)' ]
  // },
  // cifsServername: {
  //   type: String,
  //   default: null,
  //   minlength: [ this.cifs ? 2 : false, 'CIFS Server Name, Minimum 2 char required'],
  //   maxlength: [ 15, 'CIFS Server Name, Maximum 15 char allowed'],
  //   required: [ isCIFSEnabled, 'CifsServername is required' ],
  //   trim: true,
  //   match: [ /^[a-z0-9-]*$/ , 'CIFS Servername can only include alphanumeric (lowercase) & dash' ]
  // },
  // cifsDomain: {
  //   type: String,
  //   default: null,
  //   minlength: [ this.cifs ? 2: false, 'CIFS Domain, Minimum 2 char required'],
  //   maxlength: [ 64, 'CIFS Domain, Maximum 64 char allowed'],
  //   required: [ isCIFSEnabled, 'CifsDomain is required' ],
  //   trim: true,
  //   match: [ /^[a-z0-9.-]*$/ , 'CIFS Domain can only include alphanumeric (lowercase), dots & dash' ]
  // },
  // cifsOu: {
  //   type: String,
  //   default: '',
  //   trim: true
  // },
  // cifsSite: {
  //   type: String,
  //   default: '',
  //   trim: true
  // },
  // iscsi: {
  //   type: Boolean,
  //   default: false
  // },
  // iscsiAlias: {
  //   type: String,
  //   default: null,
  //   minlength: [ 3, 'iSCSI Alias, Minimum 3 char required'],
  //   maxlength: [ 32, 'iSCSI Alias, Maximum 32 char allowed'],
  //   trim: true,
  //   match: [ /^[a-z0-9.-]*$/ , 'iSCSI Alias can only include alphanumeric (lowercase) characters, dashes and dots' ]
  // },
  // cluster_id: {
  //   type: Schema.ObjectId,
  //   ref: 'ontap_clusters'
  // },
  // ontap_cluster_uuid: {
  //   type: String,
  //   default: null
  // },
  // ontap_vserver_uuid: {
  //   type: String,
  //   default: null
  // },
  // apis_storage_vm_key: {
  //   type: String,
  //   default: null
  // },
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

  if (self.cluster) {
    var cluster_id = (self.cluster._id) ? mongoose.Types.ObjectId(self.cluster._id) : self.cluster;
    mongoose.model('ontap_clusters').findById(cluster_id).exec(function (err, cluster) {
      if (err) {
        invalidateAndLog(err, 'cluster', 'Invalid Cluster ID');
      } else if (!cluster) {
        invalidateAndLog('Invalid Cluster ID', 'cluster', 'Invalid Cluster ID');
      } else {
        mongoose.model('Server').find({name: new RegExp('^'+ self.name + '$', "i"), cluster: self.cluster}).exec(function (err, server) {
          if (err) {
            logger.info('Server Model: ' + err);
          } else if (server.length) {
            if (server.length > 1 || (server.length === 1 && server[0]._id.toString() !== self._id.toString())) {
              self.invalidate('name', 'Name has to be unique within the cluster');
            }
          }
        });
      }
      next();
    });
  } else {
    next();
  }

  function invalidateAndLog(logMessage, invalidateField, InvalidateMsg) {
    logger.info('Server Model: ' + logMessage);
    self.invalidate(invalidateField, InvalidateMsg);
  }
});

ServerSchema.index({ name: 1, cluster: 1 }, { unique: true });

ServerSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.serverId = obj._id;
  delete obj.user;
  delete obj.created;
  delete obj.vlan;
  delete obj.pod;
  delete obj._id;  
  delete obj.ipVirtClus;
  return obj;
};

mongoose.model('Server', ServerSchema);
