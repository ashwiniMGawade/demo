'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  passport = require('passport'),
  _ = require('lodash'),
  SamlStrategy = require('passport-saml').Strategy,
  logger = require(path.resolve('./config/lib/log')),
  User = mongoose.model('User'),
  config = require(path.resolve('./config/config')),
  fs = require('fs');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin'
];

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  })(req, res, next);
};

 var loginUser = function(req, res, user) {
    // Remove sensitive data before login
    user.password = undefined;
    user.salt = undefined;
    req.login(user, function (err) {      
      if (err) {
        res.status(400).send(err);
      } else {
        res.json(user);
      }
    });
}

exports.ldap_signin = function (req, res, next) {
  passport.authenticate('ldapauth', function (err, user, info) {
    if (err || !user) {
      passport.authenticate('local', function (err, user, info) {
        if (err || !user) {
          res.status(400).send(info);
        } else {
          loginUser(req, res, user)
        }
      })(req, res, next);
      
    } else {
      loginUser(req, res, user)
    }
  })(req, res, next);
}

/**
 * Signout
 */
exports.signout = function (req, res) {   
  //If query parameter contains provider
  logger.info(req.query.provider);
  if (req.query.provider && req.query.provider !== 'local') {
    logger.info("logout odin user");
    req.logout();   
    return res.redirect('/login'); 
  } else {
    if(req.user && req.user.providerData && typeof req.user.providerData.code !== "undefined") {
      var saml_strg_obj = new SamlStrategy({
        path: config.idp.path,
        entryPoint: config.idp.entryPoint,
        issuer: config.idp.issuer,
        logoutUrl: config.idp.logoutUrl,
        identifierFormat: config.idp.identifierFormat,
        passReqToCallback: true,
        cert: config.idp.cert
        //privateCert: fs.readFileSync(config.idp.privateCertFile, 'utf-8')
      }, function(){

      });  
      var samlReqObj = {
        user: {
          nameID : req.user.providerData && req.user.providerData.code || 'test',
          nameIDFormat : config.idp.identifierFormat
        }
      };    
      logger.info('saml req object');
      logger.info(samlReqObj);
      return saml_strg_obj.logout(samlReqObj, function(err, uri) {
        if(err) {
          logger.error(err);
        } else {
          logger.info("return response uri" + uri);
          return res.redirect(uri);
        }   
      });   
    } else {
      req.logout();
      res.redirect('/'); 
    } 
  }   
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    // Set redirection path on session.
    // Do not redirect to a signin or signup page
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
      req.session.redirect_to = req.query.redirect_to;
    }
    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // Pop redirect URL from session
    var sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    passport.authenticate(strategy, function (err, user, redirectURL) {
      if (err) {
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }

        return res.redirect(redirectURL || sessionRedirectURL || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  if (!req.user) {
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };

    User.findOne(searchQuery, function (err, user) {
      if (err) {
        return done(err);
      } else {
        if (!user) {
          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');
          User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              email: providerUserProfile.email,
              profileImageURL: providerUserProfile.profileImageURL,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData,
              roles: providerUserProfile.roles,
              tenant: providerUserProfile.tenant
            });

            console.log("user before inserting recored in user table", user)

            // And save the user
            user.save(function (err) {
              return done(err, user);
            });
          });
        } else {
          return done(err, user);
        }
      }
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    var user = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
    if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
      // Add the provider data to the additional provider data field
      if (!user.additionalProvidersData) {
        user.additionalProvidersData = {};
      }

      user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');

      // And save the user
      user.save(function (err) {
        return done(err, user, '/settings/accounts');
      });
    } else {
      return done(null, user);
    }
  }
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'User is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};


var loginODINUser = function(req, res, next, user) {
  //check user is allowed access to API 
  req.login(user, {}, function (err) {
        if (err) {
          return next(err);
        }
      });
  logger.info('ODIN logged in');
  // Temporary odinuser identification as its session less, not available on req.user
  next();    
}

/**
 * Authentication for User creation through ODIN
 */
exports.loginODIN = function (req, res, next) {
  if (!req.headers.authorization && req.isAuthenticated()) {
    // Not ODIN user continue normal flow
    next();
  }
  else {
    if (!req.headers.authorization) {
      return res.status(401).json({
          message: 'Authentication required!'
        });
    }
    // User not logged in, login as ODIN (LDAP)
    var parts = req.headers.authorization.split(' ')
    if (parts.length < 2) { return this.fail(400); }
  
    var scheme = parts[0]
    , credentials = new Buffer(parts[1], 'base64').toString().split(':');

    req.query.username = credentials[0]
    req.query.password = credentials[1]

    passport.authenticate('ldapauth', function (err, user, info) {
      if (err || !user) {
        passport.authenticate('basic', { session: false }, function (err, user) {
          if (user === false) {
            // Invalid user or user not authorized
            return res.status(401).json({
              message: 'Invalid username/password'
            });
          }
          else {
            loginODINUser(req, res, next, user)     
          }
        })(req, res, next);
      } else {
        loginODINUser(req, res, next, user) 
      }
      })(req, res, next);    
  }
};

/**
 * Logout after User creation through ODIN
 * Commented this code for now, can be enabled back if required for logout
 */
// exports.logoutODIN = function (req, res, next) {
//   // check odin has been logged in, if yes then logoff
//   if (req.odinlogoff) {
//     logger.info('ODIN logged out');
//     // user is already authenticated normal flow
//     //req.logout();
//   }
//   next();
// };
