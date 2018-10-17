'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');

exports.sanitizeObjectForLoggerMessage = function(object) {
  var newObject = JSON.parse(JSON.stringify(object));
  var result = _.pickBy(object, function(value, key) {
    return key.toLowerCase().indexOf("password") >= 0 || key.toLowerCase() === "email" || key.toLowerCase().indexOf("phone") >= 0;
  });  
  _.forEach(result, function(value, key) {
    newObject[key] = '*********';
  });
  return newObject;
};
