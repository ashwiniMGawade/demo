'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  LdapStrategy = require('passport-ldapauth'),
  users = require('../../controllers/users.server.controller'),
  path = require('path'),
  mongoose = require('mongoose'),
  Tenant = mongoose.model('Tenant'),
  logger = require(path.resolve('./config/lib/log')),
  _ = require("lodash"),
  config = require(path.resolve('./config/config'));


module.exports = function (config) {
  // Use active directory strategy
	passport.use(new LdapStrategy({
	    server: {
	      url: config.ldap.url,
	      bindDN: config.ldap.bindDN, // 'cn='root''
	      bindCredentials: config.ldap.bindCredentials, //Password for bindDN
	      searchBase: config.ldap.searchBase,
		  searchFilter: '('+config.ldap.searchFilterAttr+'={{username}})'
		},
	  	usernameField: 'username',
		//searchAttributes: ['displayName', 'mail'],
		passReqToCallback: true
	    
	  },
	  function(req, user, done) {
		  // Set the provider data and include tokens
		    var providerData = {};
		    providerData.memberOf = user.memberOf;
		    providerData.email = user.userPrincipalName

		    // Create the user OAuth profile
		    var providerUserProfile = {
		      firstName: user.givenName,
		      lastName: user.sn,
		      displayName: user.displayName,
		      email: user.userPrincipalName,
		      username: user.sAMAccountName,
		      profileImageURL: (user.pictureUrl) ? user.pictureUrl : undefined,
		      provider: 'activeDirectory',
		      providerIdentifierField: 'email',
		      providerData: providerData
		    };

		    var tenantCode = '';
		    //Decide user role
		    var properties = user.memberOf.split(',');
		    _.each(properties, function(property) {
		    	if (property.indexOf('nse-') >=0 ) {
		    		var attrValues = property.split("-");
		    		tenantCode = attrValues[2];
		    		providerUserProfile.roles = [attrValues[1]]
		    	}
		    });

		    Tenant.find({code: tenantCode.toLowerCase()}).exec(function (err, tenant) {
			    if (err) {
			      logger.info('Tenant Model: ' + err);
			    } else if(tenant.length) {
			      if(tenant.length > 0 ) {
			        providerUserProfile.tenant = tenant[0]._id
			      }    			
    			}
    		});

		    

		    // Save the user OAuth profile
		    users.saveOAuthUserProfile(req, providerUserProfile, done);
		}
	));
}