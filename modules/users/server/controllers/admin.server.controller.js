'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  Job = mongoose.model('Job'),
  sanitizeMessage = require(path.resolve('./config/lib/SanitizeMessage')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

// To respond with proper error message
function respondError(res, errCode, errMessage){
    res.status(errCode).send({
     message: errMessage
    });
}

/**
 * Create a user
 */
exports.create = function (req, res) {
  var user = new User();
  user.firstName = req.body.firstName || '';
  user.lastName = req.body.lastName || '';

  user.phone = req.body.phone || '';
  user.username = req.body.username || '';
  user.email = req.body.email || '';
  user.roles = req.body.roles || [];
  user.password = req.body.password || '';
  user.provider = req.body.provider || '';
  user.tenant = req.body.tenantId || null;
  user.providerData = req.body.providerCode ? { "code" : req.body.providerCode } : { } ;

  
  //Role is mandatory
  if (user.roles.length === 0) {
    return respondError(res, 400, 'Role field is required.');
  }

  //Role can only be array and should have only one value
  if(user.roles.constructor !== Array || user.roles.length > 1) {
    return respondError(res, 400, 'Invalid value for roles field');
  }

  //Provider is mandatory
  if(!user.provider){
    return respondError(res, 400, 'Provider is required.');
  }

  //Partner cant create user with provider 'local'
  if (_.includes(req.user.roles, 'partner') && user.provider === 'local') {
    return respondError(res, 403, 'User is not authorized');
  }

  //Partner cant create root or partner
  if (_.includes(req.user.roles, 'partner') && (_.includes(user.roles, 'root') || _.includes(user.roles, 'partner'))) {
    return respondError(res, 403, 'User is not authorized');
  }

  //Root or partner or l1ops can only be a local provider
  if ((_.includes(user.roles, 'root') || _.includes(user.roles, 'partner') || _.includes(user.roles, 'l1ops')) && user.provider !== 'local') {
    return respondError(res, 400, 'Provider for Root, Partner & L1-Ops has to be local');
  }

  //Local user needs password
  if (user.provider === 'local' && !user.password) {
    return respondError(res, 400, 'Password field is required.');
  }

  //non-local user needs providerCode
  if (user.provider !== 'local' && !user.providerData.code){
    return respondError(res, 400, 'Provider Code is required.');
  }

  //providerCode valdiation for non-local user
  if(user.provider !== 'local' && user.providerData.code && !user.providerData.code.match(/^[a-zA-Z0-9_\-\\.@]{3,256}$/)){
    return respondError(res, 400, "Provider Code must be 3-256 characters, only alphanumeric, dot, dash, underscore & @ allowed");
  }

  //local user need a username
  if(user.provider === 'local' && !user.username){
    return respondError(res, 400, 'Username is required.');
  }

  if (user.tenant) {
    if (!req.body.tenantId.match(/^[0-9a-fA-F]{24}$/)) {
      return respondError(res, 400, 'Invalid Tenant Id, required mongoose ObjectId');
    }
    mongoose.model('Tenant').findById(user.tenant).exec(function (err, tenant) {
      var roles = (req.user) ? req.user.roles : ['guest'];

      if (err) {
        return respondError(res, 400, 'Invalid Tenant ID');
      } else if (!tenant) {
        return respondError(res, 400, 'Invalid Tenant ID');
      } else {
        //Root  and l1Ops gets to access all tenants user
        if (_.includes(roles, 'root') || _.includes(user.roles, 'l1ops')) {
        //Partner gets to access all objects under tenancy and his partner tenancy
        } else if ( _.includes(roles, 'partner') &&
                    ( (tenant._id.toString() === req.user.tenant.toString()) ||
                      (tenant.partner && tenant.partner.toString() === req.user.tenant.toString()) ) ) {
        //Others gets to access all objects under their tenancy
        } else if ( tenant._id.toString() !== req.user.tenant.toString()) {
          return respondError(res, 403, 'User is not authorized');
        }
      }
    });
  }
  

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {     
      Job.create(req, 'user', function(err, createUserJob) {
        // Remove sensitive data before login
        User.findById(user._id, '-salt -password')
            .populate('tenant', 'name code')
            .populate('partner', 'name code').exec(function (err, user) {
          if (err) {
            createUserJob.update('Failed', err, user);
            return err;
          } else if (!user) {
            createUserJob.update('Failed', 'Failed to load user ' + user._id, user);
            return new Error('Failed to load user ' + user._id);
          }
          createUserJob.update('Completed', null, user);
          res.json(user);
        });
      });
    }
  });
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;
  
  //If no value in request for these parameters use the existing value from model
  user.firstName = _.isUndefined(req.body.firstName) ? user.firstName : req.body.firstName;
  user.lastName = _.isUndefined(req.body.lastName) ? user.lastName : req.body.lastName;
  user.email = _.isUndefined(req.body.email) ? user.email : req.body.email;
  user.phone = _.isUndefined(req.body.phone) ? user.phone : req.body.phone;
  user.roles = _.isUndefined(req.body.roles) ||  _.includes(user.roles, 'root') || _.includes(user.roles, 'partner') ? user.roles : req.body.roles;
  user.acceptTC = _.isUndefined(req.body.acceptTC) ? user.acceptTC : req.body.acceptTC;
  //Role can only be array and should have only one value 
  if (user.roles.constructor !== Array || user.roles.length > 1) {
    return respondError(res, 400, 'Invalid value for roles field');
  }

  //Partner cant change user to root or partner - For other users create or edit API not exposed
  // if (_.includes(req.user.roles, 'partner') && (_.includes(user.roles, 'root') || _.includes(user.roles, 'partner'))) {
  //   return respondError(res, 403, 'User is not authorized');
  // }

  //Root gets to update local user password
  if(_.includes(req.user.roles, 'root') && user.provider === 'local'){
    user.password = _.isUndefined(req.body.password) ? user.password : req.body.password;
  }

  //Local user needs password
  if (user.provider === 'local' && !user.password) {
    return respondError(res, 400, 'Password can not be empty');
  }

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Job.create(req, 'user', function(err, updadteUserJob) {
        // Remove sensitive data
        User.findById(user._id, '-salt -password')
        .populate('tenant', 'name code')
        .populate('partner', 'name code')
        .exec(function (err, user) {
          if (err) {
            updadteUserJob.update('Failed', err, user);
            return err;
          } else if (!user) {
            updadteUserJob.update('Failed', 'Failed to load user ' + user._id, user);
            return new Error('Failed to load user ' + user._id);
          }
          updadteUserJob.update('Completed', null, user);
          res.json(user);
        });
      });
    }
  });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  if(_.includes(req.user.roles, 'partner') && (_.includes(user.roles, 'root') || _.includes(user.roles, 'partner'))){
    return respondError(res, 403, 'User is not authorized');
  }

  user.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    Job.create(req, 'user', function(err, deleteUserJob) {
      deleteUserJob.update('Completed', null, user);
    });
    res.json({});
  });
};

/**
 * List of Users
 */
exports.list = function (req, res) {

  //Root can see all users
  if (_.includes(req.user.roles, 'root') || _.includes(req.user.roles, 'l1ops')) {
    User.find({ }, '-salt -password').sort('+name')
    .populate('tenant', 'name code')
    .populate('partner', 'name code')
    .exec(function (err, users) {
      respond(err, users);
    });
    //Partner can see all users under his tenancy & non root
  } else if (_.includes(req.user.roles, 'partner')) {
    User.find({
      $and : [ {'roles': { $elemMatch: { $nin: ['root'] } } },
               { $or:[ {'tenant':req.user.tenant }, {'partner':req.user.tenant } ] }
    ]}, '-salt -password').sort('+name')
    .populate('tenant', 'name code')
    .populate('partner', 'name code')
    .exec(function (err, users) {
      respond(err, users);
    });
  } else {
    User.find({
      'tenant': req.user.tenant,
      'roles': { $elemMatch: { $nin: ['root', 'partner'] } }
    }, '-salt -password')
    .populate('tenant', 'name code')
    .populate('partner', 'name code')
    .exec(function (err, users) {
      respond(err, users);
    });
  }

  function respond(err, users) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(users);
    }
  }
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return respondError(res, 400, 'Invalid UserID');
  }

  User.findById(id, '-salt')
  .populate('tenant', 'name code')
  .populate('partner', 'name code')
  .exec(function (err, user) {
    if (err) {
      return respondError(res, 400, 'Invalid UserID');
    } else if (!user) {
      return respondError(res, 400, 'Invalid UserID');
    }
    if (req.user && user && _.includes(req.user.roles, 'partner') && _.includes(user.roles, 'root')){
      return respondError(res, 403, 'User is not authorized');
    }
    if (req.user && user && _.includes(req.user.roles, 'partner') && _.includes(user.roles, 'l1ops')){
      return respondError(res, 403, 'User is not authorized');
    }
    req.model = user;
    next();
  });
};
