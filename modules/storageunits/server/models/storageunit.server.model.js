'use strict';

/**
 * Storage unit Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  logger = require(path.resolve('./config/lib/log')),
  Schema = mongoose.Schema;

/**
 * Storage unit Schema
 */
var StorageunitSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    required: 'Storage Unit name required',
    maxlength: [64, 'Storage unit name, Maximum 64 char allowed'],
    minlength: [3, 'Storage unit name, Minimum 3 char required'],
    match: [/^[a-zA-Z0-9\ -]*$/, 'Name can only include dash, space and alphanumeric characters']
  },
  code: {
    type: String,
    trim: true,
    required: 'Storage Unit code required',
    maxlength: [32, 'Storage unit code, Maximum 32 char allowed'],
    minlength: [3, 'Storage unit code, Minimum 3 char required'],
    match: [/^[a-z][a-z0-9\_]*$/, 'Storage Unit code can only include lowercase alphanumeric characters and underscores (First character must be alphabetical)']
  },
  application: {
    type: Schema.ObjectId,
    ref: 'Application',
    required: 'Application required'
  },
  cluster: {
    type: Schema.ObjectId,
    ref: 'ontap_clusters',
    required: 'Storage group required'
  },
  server: {
    type: Schema.ObjectId,
    ref: 'Server',
    required: 'Storage group required'
  },
  aggr: {
    type: String,
    trim: true,
    required: "Aggregate name is required"
  },
  destinationAggr:{
    type: String,
    trim: true
  },
  destinationCluster: {
    type: String,
    trim: true,
  },
  destinationVserver: {
    type: String,
    trim: true,
  },
  dr_enabled: {
    type:Boolean,
    default:false
  },
  sizegb: {
    type: Number,
    min: [100, 'Storage Unit Size should be greater than or equal to 100'],
    max: [16384, 'Storage Unit Size should be lesser than or equal to 16384'],
    trim: true,
    required: 'Storage Unit size required',
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value for size'
    }
  },
  acl: {
    type: String,
    trim: true
    //match:[/^((((iqn\.[0-9]{4}-[0-9]{2}\.(([a-zA-Z]+[a-zA-Z0-9\-]*)+(.[a-zA-Z]+[a-zA-Z0-9\-]*)*)+(:[a-zA-Z0-9]+))+(,((iqn\.[0-9]{4}-[0-9]{2}\.(([a-zA-Z]+[a-zA-Z0-9\-]*)+(.[a-zA-Z]+[a-zA-Z0-9\-]*)*)+(:[a-zA-Z0-9]+)))+)*)|(((((25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)((\/([8-9]|1[0-9]|2[0-6]))*))))+((,((((25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)((\/([8-9]|1[0-9]|2[0-6]))*))))+))*)))$/, 'Please enter valid ACL']
  },
  schedule: {
    type: String,
    trim:true
  },
  readWriteClients: {
    type: String,
    trim: true,
    required: function() { return this.protocol === 'nfs' ? 'Read write clients are required' : false; },
  },
  readOnlyClients: {
    type: String,
    trim: true,
    required: function() { return this.protocol === 'nfs' ? 'Read write clients are required' : false; },
  },
  igroup: {
    type: String,
    trim: true,
    required: function() { return this.protocol === 'iscsi' || this.protocol === 'fc' ? 'Storage Unit igroup is required' : false; },
    maxlength: [32, 'Storage unit igroup, Maximum 32 char allowed'],
    minlength: [3, 'Storage unit igroup, Minimum 3 char required'],
    match: [/^[a-z][a-z0-9\_]*$/, 'Storage Unit igroup can only include lowercase alphanumeric characters and underscores (First character must be alphabetical)']
  },
  mapping: {
    type: String,
    enum: {
      values: ["existing","new"],
      message: '`{VALUE}` not a valid value for Mapping'
    },
    required: function() { return this.protocol === 'iscsi' || this.protocol === 'fc' ? 'Storage Unit mapping is required' : false; },
  },
  protocol: {
    type: String,
    enum: {
      values: ['cifs', 'nfs', 'iscsi', 'fc'],
      message: '`{VALUE}` not a valid value for protocol'
    },
    required: 'Storage Unit protocol required'
  },
  lunOs: {
    type: String,
    enum: {
      values: ['', 'aix', 'hpux', 'hyper_v', 'image', 'linux', 'netware', 'openvms', 'solaris', 'solaris_efi', 'vmware', 'windows', 'windows_2008', 'windows_gpt', 'xen'],
      message: '`{VALUE}` not a valid value for lunOS'
    },
    required: function() { return this.protocol === 'iscsi' || this.protocol === 'fc' ? 'Storage Unit lunos is required' : false; },
  },
  lunId: {
    type: Number,
    min:[0, 'Minimum allowed value is 0'],
    max:[255, 'Maximum allowed value is 255']
  },
  status: {
    type: String,
    default: 'Creating',
    enum: ['Creating', 'Updating', 'Deleting', 'Operational', 'Contact Support']
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
 * Hook a pre save method to set the Tenant, subtenant
 */
StorageunitSchema.pre('save', function (next, done) {
  if (!this.isNew) {
    next();
  } else {
    var self = this;
    // mongoose.model('ontap_clusters').findById(self.cluster).exec(function (err, cluster) {
    //   if (err) {
    //     logger.info('Storageunit Model: ' + err);
    //   } else if (!storagegroup) {
    //     logger.info('Storageunit Model: Invalid Cluster ID');
    //   } else {
    //     self.cluster = storagegroup.tenant_id;
    //     self.subtenant = storagegroup.subtenant_id;
    //     self.server = storagegroup.server;
    //     self.partner = storagegroup.partner;
    //     self.subscription = storagegroup.subscription;
    //   }
    //   next();
    // });
    next();
  }
});

/**
 * Hook a pre save method to Validate the Storage group
 */
StorageunitSchema.pre('validate', function (next, done) {
  var self = this;
  next();

  // validStoragegroup();

  // Only checked with a new object (can not change storage group)
  function validCluster() {
    mongoose.model('ontap_clusters').findById(self.cluster).exec(function (err, cluster) {
      if (err) {
        logger.info('Storageunit Model: ' + err);
        self.invalidate('storagegroup', 'Invalid cluster ID');
        next();
      } else if (!cluster) {
        logger.info('Storageunit Model: Invalid cluster ID');
        self.invalidate('cluster', 'Invalid cluster ID');
        next();
      } else if(cluster.aggregates.length > 0) {
        var validAggr = false
        cluster.aggregates.forEach(function(aggr) {
          if (aggr.name == self.aggr) {
            validAggr = true;
            break;
          }
        })
        if(!validAggr) {
          logger.info('Storageunit Model: Invalid aggregate name');
          self.invalidate('aggr', 'Invalid aggregate name');
          next();
        } else {
          validServer(cluster);
        }
      } else {
        logger.info('Storageunit Model: Invalid cluster ID');
        self.invalidate('cluster', 'Invalid cluster ID, Cluster does not have any aggregates');
        next();
      }
    });
  }

  // Only checked with a new object (can not change protocol)
  function validServer(cluster) {
    mongoose.model('Server').findById(self.server).exec(function (err, server) {
      if (err) {
        logger.info('Storageunit Model: ' + err);
        self.invalidate('server', 'Error with Server associated with Storagegroup');
        next();
      } else if (!server) {
        logger.info('Storageunit Model: Invalid Server ID - Should never happen');
        self.invalidate('server', 'Invalid Server ID associated with storageunit');
        next();
      } else if (self.isNew && self.protocol && !server.protocols.indexOf[self.protocol] === -1) {
        logger.info('Storageunit Model: Protocol not enabled on Server');
        self.invalidate('server', 'Storageunit\'s Server is not enabled for specified Protocol');
        next();
      } else if(server.cluster !== cluster.clusterId) {
        //check if the server belongs to the cluster chosen
        logger.info('Storageunit Model: Server does not belongs to specified cluster');
        self.invalidate('server', "Server does not belongs to specified cluster");
        next();
      } else {
        validACL()
      }
    });
  }

  function availableSizeSubscription(storagegroup) {
    if (featuresSettings.paymentMethod.prePaid) {
      var sizegbDifference = 0;

      if (self.isNew) {
        sizegbDifference = self.sizegb;
      } else {
        mongoose.model('Storageunit').findById(self).exec(function (err, storageunitExisting) {
          if (err) {
            logger.info('Storageunit Model: ' + err);
            self.invalidate('storagegroup', 'Error with existing Storageunit');
            next();
          } else if (!storageunitExisting) {
            // Storage Unit is being deleted
            validACL();
          } else {
            sizegbDifference = self.sizegb - storageunitExisting.sizegb;
          }
        });
      }

      mongoose.model('Subscription').findById(storagegroup.subscription).exec(function (err, subscription) {
        if (err) {
          logger.info('Storageunit Model: ' + err);
          self.invalidate('storagegroup', 'Error with Subscription associated with Storagegroup');
          next();
        } else if (!subscription) {
          logger.info('Storageunit Model: Invalid Subscription ID - Should never happen');
          self.invalidate('storagegroup', 'Invalid Subscription ID associated with Storagegroup');
          next();
        } else {
          _.forEach(subscription.storagePack, function (value, key) {
            if (value.class === 'ontap-' + storagegroup.tier) {
              var classElements = _.filter(subscription.storagePack, {'class': value.class});
              if (classElements && classElements.length > 1) {
                logger.info('Storageunit Model: Duplicate Storage Pack Class - Should never happen');
                self.invalidate('storagegroup', 'Invalid Subscription associated with Storagegroup');
                next();
              } else if (subscription.storagePack[key].sizegb.available - sizegbDifference > 0) {
                validACL();
              } else {
                logger.info('Storageunit Model: Subscription Storage Pack Size Unavailable');
                self.invalidate('storagegroup', 'Insufficient purchased capacity in Subscription');
                next();
              }
            }
          });
          // TODO What happens if no match is found? Need to run in serial with forEach.
        }
      });
    } else {
      validACL();
    }
  }

  function validACL() {
    if (self.protocol === 'iscsi' && self.acl) {
      if (!(/^((?:iqn\.[0-9]{4}-[0-9]{2}(?:\.[A-Za-z](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)+(?::[^,:]*)?)|(eui\.[0-9A-Fa-f]{16}))+(?:,((?:iqn\.[0-9]{4}-[0-9]{2}(?:\.[A-Za-z](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)+(?::[^,:]*)?)|(eui\.[0-9A-Fa-f]{16}))+)*$/).test(self.acl)) {
        self.invalidate('acl', 'Invalid ACL');
        next();
      } else {
        uniqueCode();
      }
    } else if(self.protocol === 'nfs' && self.acl) {
      if (!(/^(((((25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)((\/([8-9]|1[0-9]|2[0-6]))*))))+((,((((25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)((\/([8-9]|1[0-9]|2[0-6]))*))))+))*)$/).test(self.acl)) {
        self.invalidate('acl', 'Invalid ACL');
        next();
      } else {
        uniqueCode();
      }
    } else if(self.protocol === 'fc' && self.acl) {
      if (!(/^(((((25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)((\/([8-9]|1[0-9]|2[0-6]))*))))+((,((((25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)((\/([8-9]|1[0-9]|2[0-6]))*))))+))*)$/).test(self.acl)) {
        self.invalidate('acl', 'Invalid ACL');
        next();
      } else {
        uniqueCode();
      }
    } else {
      uniqueCode();
    }
  }

  // Only checked with a new object (can not change code)
  function uniqueCode() {
    mongoose.model('Storageunit').find({code: new RegExp('^'+ self.code + '$', "i"), cluster: self.cluster, server: self.server}).exec(function (err, storageunit) {
      if (err) {
        logger.info('Storageunit Model: ' + err);
        self.invalidate('code', 'Code has to be unique per Cluster, Server combination');
        next();
      } else if (storageunit.length) {
        if (storageunit.length > 1 || (storageunit.length === 1 && storageunit[0]._id.toString() !== self._id.toString())) {
          logger.info('Storageunit Model: Code not unique per Cluster, Server combination');
          self.invalidate('code', 'Code has to be unique per Cluster, Server combination');
          next();
        } else {
          uniqueName();
        }
      } else {
        uniqueName();
      }
    });
  }

  function uniqueName() {
    mongoose.model('Storageunit').find({name: new RegExp('^' + self.name + '$', "i"), cluster: self.cluster, server:self.server}).exec(function (err, storageunit) {
      if (err) {
        logger.info('Storageunit Model: ' + err);
        self.invalidate('name', 'Name has to be unique per Cluster, Server combination');
        next();
      } else if (storageunit.length) {
        if (storageunit.length > 1 || (storageunit.length === 1 && storageunit[0]._id.toString() !== self._id.toString())) {
          logger.info('Storageunit Model: Name not unique per Cluster, Server combination');
          self.invalidate('name', 'Name has to be unique per Cluster, Server combination');
          next();
        } else{
          next();
        }
      } else {
        next();
      }
    });
  }
});

StorageunitSchema.index({ name: 1, cluster: 1, server: 1 }, { unique: true });
StorageunitSchema.index({ code: 1, cluster: 1, server: 1 }, { unique: true });

StorageunitSchema.methods.toJSON = function() {
  var obj = this.toObject();
  obj.storageunitId = obj._id;
  delete obj.user;
  // delete obj.created;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Storageunit', StorageunitSchema);
