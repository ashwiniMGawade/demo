'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  path = require('path'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  sanitizeMessage = require(path.resolve('./config/lib/SanitizeMessage')),
  _ = require('lodash'),
  Schema = mongoose.Schema;

/**
 * Job Schema
 */
var JobSchema = new Schema({
  tenant: {
    type: Object
  },
  user: {
    type: Object,
    required: 'User required'
  },
  operation: {
    type: String,
    enum: {
      values: ['Create', 'Update', 'Delete'],
      message: '`{VALUE}` not a valid value for operation'
    },
    required: 'Operation required'
  },
  module: {
    type: String,
    trim: true,
    required: 'Module required'
  },
  payload: {
    type: Object
  },
  status: {
    type: String,
    enum: {
      values: ['Processing', 'Failed', 'Completed'],
      message: '`{VALUE}` not a valid value for status'
    },
    default: 'Processing'
  },
  object: {
    type: Object
  },
  result: {
    type: Object
  },
  comments: {
    type : String
  }, 
  partner: {
    type: Object
  }, 
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  }
});

JobSchema.statics.create = function (req, module, callback) {
  var _this = new this();
  _this.user = {'userId' : req.user._id, 'username' : req.user.username};
  _this.module = module;
  _this.operation = getOperation(req.method);
  _this.payload = sanitizeMessage.sanitizeObjectForLoggerMessage(req.body);
  if(req.user.tenant && _this.module !== 'notification'){
    mongoose.model('Tenant').findById(req.user.tenant).exec(function (err, tenant) {
      if(!err && tenant){
        _this.tenant = {'code' : tenant.code, 'tenantId' : tenant._id };            
      }
      saveJob();
    });
  }else{
    saveJob();
  }
  function saveJob(){
    _this.save(function(err, res) {
      if (err) {
        logger.info(err);
      }
      logger.info("Successfully created job" + util.inspect(_this, { showHidden: true, depth: null }));
      callback(null, _this);
    });
  }
};

JobSchema.methods.update = function(status, comments, result) {
  var _this = this;
  _this.status = status;
  _this.comments = comments;
  _this.result = JSON.stringify(sanitizeMessage.sanitizeObjectForLoggerMessage(result));
  _this.object = { 
    'id' :  mongoose.Types.ObjectId(result[_this.module + 'Id'] ? result[_this.module + 'Id']: (result._id ? result._id: null)),
    'code' : result.code ? result.code : ''
  };
  _this.updated = new Date();
  if ( !_this.tenant && result.tenant ) {
    _this.tenant = {'code' : result.tenant.code, 'tenantId' : result.tenant._id};
  }  
  if (result.partner) {
    _this.partner = {'code' : result.partner.code, 'partnerId' : result.partner._id};
  }

  _this.save(function(err, res) {
    if (err) {
      logger.info(err);
    }
    logger.info("Successfully updated job" + util.inspect(_this, { showHidden: true, depth: null }));
  });
};

function getOperation(reqMethod) {
  switch(reqMethod) {
    case 'PUT':
      return 'Update';
    case 'POST':
      return 'Create';
    case 'DELETE':
      return 'Delete';
    default: return 'Create';
  }
}

JobSchema.methods.toJSON = function () {
  var obj = this.toObject();
  obj.jobId = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

mongoose.model('Job', JobSchema);
