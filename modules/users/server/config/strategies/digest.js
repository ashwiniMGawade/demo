'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  BasicStrategy = require('passport-http').BasicStrategy,
  users = require('../../controllers/users.server.controller'),
  mongoose = require('mongoose'),
  User = mongoose.model('User');

module.exports = function (config) {
  // Basic strategy
  passport.use(new BasicStrategy(
    function(userid, password, done) {
      // Check for user credentials
      User.findOne({ username: userid }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(err, false); }
        if (!user.authenticate(password)) { return done(err, false); }
        return done(null, user);
      });
    }
  ));

};