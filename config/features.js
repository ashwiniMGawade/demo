'use strict';

var _ = require('lodash'),
    labels = require('./labels');


var settings =  {
  'paymentMethod' : {
    'prePaid' : false // false for post-paid
  },
  'tenant': {
    'annotation': {
      'enabled': true, //false for disabled
      'mandatory': false //false for optional,
    },
    'providers' : {
      'allowed': ['raa', 'local', 'telstraifb']   
    }
  },
  'subscription' : {
    'site': {
      'enabled': true, //false for disabled
      'mandatory': true //false for optional,
    },
    'description' : {
      'enabled': true, //false for disabled
      'mandatory': true //false for optional,
    },
    'url' : {
      'enabled': true,
      'mandatory': true
    }
  },
  'server': {
    'gateway': {
      'enabled': true //false for disabled
    }
  },
  'pageRefresh' : '30000',
  'permissions': { // dfaas permissions
    'root': {  // role name
      'site'        : 'CLRUD',
      'pod'         : 'CLRUD',
      'cluster'     : 'CLRUD',
      'replica'     : 'CLRUD',
      'backup'      : 'CLRUD',
      'tenant'      : 'CLRUD',
      'subtenant'   : 'CLRUD',
      'user'        : 'CLRUD',
      'subscription': 'CLRUD',
      'server'      : 'CLRUD',
      'storagegroup': 'CLRUD',
      'storageunit' : 'CLRUD',
      'snapshot'    : 'CLD',
      'icr'         : 'CLRUD',
      'notification': 'CLRUD',
      'job'         : 'LR'
    },
    'l1ops': {  // role name
      'site'        : 'LR',
      'pod'         : 'LR',
      'cluster'     : 'LR',
      'replica'     : 'LR',
      'backup'      : 'LR',
      'tenant'      : 'LR',
      'subtenant'   : 'LR',
      'user'        : 'LR',
      'subscription': 'LR',
      'server'      : 'LR',
      'storagegroup': 'LR',
      'storageunit' : 'LR',
      'snapshot'    : 'L',
      'icr'         : 'LR',
      'notification': 'LR',
      'job'         : 'LR'
    },
    'partner': {  // role name
      'site'        : 'LR',
      'pod'         : '',
      'cluster'     : '',
      'replica'     : '',
      'backup'     : '',
      'tenant'      : 'CLRUD',
      'subtenant'   : '',
      'user'        : 'CLRUD',
      'subscription': 'CLRUD',
      'server'      : '',
      'storagegroup': '',
      'storageunit' : '',
      'snapshot'    : '',
      'icr'         : '',
      'notification': 'LRU',
      'job'         : ''
    },
    'admin': {  // role name
      'site'        : 'LR',
      'pod'         : '',
      'cluster'     : '',
      'replica'     : '',
      'backup'      : '',
      'tenant'      : 'LR',
      'subtenant'   : 'CLRUD',
      'user'        : 'LRU',
      'subscription': 'LR',
      'server'      : 'CLRUD',
      'storagegroup': 'CLRUD',
      'storageunit' : 'CLRUD',
      'snapshot'    : 'CLD',
      'icr'         : 'CLRD',
      'notification': 'LRU',
      'job'         : 'LR'
    },
    'user': {  // role name
      'site'        : 'LR',
      'pod'         : '',
      'cluster'     : '',
      'replica'     : '',
      'backup'      : '',
      'tenant'      : 'LR',
      'subtenant'   : 'LR',
      'user'        : 'LR',
      'subscription': 'LR',
      'server'      : 'LR',
      'storagegroup': 'CLRUD',
      'storageunit' : 'CLRUD',
      'snapshot'    : 'CLD',
      'icr'         : 'LR',
      'notification': 'LRU',
      'job'         : 'LR'
    },
    'read': {  // role name
      'site'        : 'LR',
      'pod'         : '',
      'cluster'     : '',
      'replica'     : '',
      'backup'      : '',
      'tenant'      : 'LR',
      'subtenant'   : 'LR',
      'user'        : 'LR',
      'subscription': 'LR',
      'server'      : 'LR',
      'storagegroup': 'LR',
      'storageunit' : 'LR',
      'snapshot'    : 'L',
      'icr'         : 'LR',
      'notification': 'LRU',
      'job'         : 'LR'
    }
  }
};

var parseRoles = function(permissions){
  var opsMap = {C:'create', U:'update', R:'read', D:'delete', L:'list'};
  var roles = {};
  _.forEach(permissions, function(modules, role) {
    _.forEach(modules, function(acl, module) {
      _.forEach(Object.keys(opsMap), function(operation){
        if(!roles[module])
          roles[module]={};
        if(!roles[module][opsMap[operation]])
          roles[module][opsMap[operation]]=[];
        if(_.includes(acl,operation)){
          roles[module][opsMap[operation]].push(role);
        }
      });
    });
  });
  //console.log(roles);
  return roles;
};

settings.roles = parseRoles(settings.permissions);
settings.labels = labels;

module.exports = settings;
