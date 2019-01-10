'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  SamlStrategy = require('passport-saml').Strategy,
  util = require('util'),
  users = require('../../controllers/users.server.controller'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  config = require(path.resolve('./config/config')),
  fs = require('fs');

module.exports = function (config) {

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });


  passport.use(new SamlStrategy({
    path: config.idp.path,
    entryPoint: config.idp.entryPoint,
    issuer: config.idp.issuer,
    logoutUrl: config.idp.logoutUrl,
    identifierFormat: config.idp.identifierFormat,
    passReqToCallback: true,
    cert: config.idp.cert || "test"
    //privateCert: fs.readFileSync(config.idp.privateCertFile, 'utf-8')
  },
    function (req, profile, done) {
      // Set the provider data and include tokens      
      var providerData = profile._json;
      logger.info(providerData);

      // var providerUserProfile = {
      //   firstName: '',
      //   lastName: '',
      //   displayName: '',
      //   email: profile.nameID,
      //   username: '',
      //   provider: 'saml',
      //   providerIdentifierField: 'username',
      //   providerData: providerData
      // };

      //var possibleUsername = providerUserProfile.email.split('@')[0];

      // User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
      // var user = new User({
      //   firstName: providerUserProfile.firstName,
      //   lastName: providerUserProfile.lastName,
      //   username: possibleUsername,
      //   displayName: providerUserProfile.displayName,
      //   email: providerUserProfile.email,
      //   profileImageURL: providerUserProfile.profileImageURL,
      //   provider: providerUserProfile.provider,
      //   providerData: providerUserProfile.providerData
      // });
      // Check the user exists in the database and pull details
      User.findOne({ providerData: {code: profile.nameID } }, function (err, user) {
        if (!user) { 
          return done(null, false, { message: 'Unknown user! If you are a first time user, please wait for 5 to 10 minutes while your access is being setup and re-launch the portal.' });
        }       
        return done(null, user);
      });
    }));
};
