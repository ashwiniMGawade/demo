'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  User = mongoose.model('User');

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id).exec(function (err, user) {
    if (err) {
      return res.status(400).send({
        message: 'User is invalid'
    });
    } else if (!user) {
       return res.status(400).send({
        message: 'User is invalid'
      });
    }

    req.profile = user;
    next();
  });
};
