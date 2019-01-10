'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  path = require('path'),  
  config = require(path.resolve('./config/config'));

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');

  // Setting up the users password api
  app.route('/api/auth/forgot').post(users.forgot);
  app.route('/api/auth/reset/:token').get(users.validateResetToken);
  app.route('/api/auth/reset/:token').post(users.reset);

  // Setting up the users authentication api
  app.route('/api/auth/signin').post(users.signin);
  app.route('/api/auth/signout').get(users.signout);

  //setting ldap AD auth routes
  app.route('/api/auth/ldap').post(users.ldap_signin);

  // Setting the facebook oauth routes
  app.route('/api/auth/facebook').get(users.oauthCall('facebook', {
    scope: ['email']
  }));
  app.route('/api/auth/facebook/callback').get(users.oauthCallback('facebook'));

  // Setting the twitter oauth routes
  app.route('/api/auth/twitter').get(users.oauthCall('twitter'));
  app.route('/api/auth/twitter/callback').get(users.oauthCallback('twitter'));

  // Setting the google oauth routes
  app.route('/api/auth/google').get(users.oauthCall('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));
  app.route('/api/auth/google/callback').get(users.oauthCallback('google'));

  // Setting the linkedin oauth routes
  app.route('/api/auth/linkedin').get(users.oauthCall('linkedin', {
    scope: [
      'r_basicprofile',
      'r_emailaddress'
    ]
  }));
  app.route('/api/auth/linkedin/callback').get(users.oauthCallback('linkedin'));

  // Setting the github oauth routes
  app.route('/api/auth/github').get(users.oauthCall('github'));
  app.route('/api/auth/github/callback').get(users.oauthCallback('github'));

  // Setting the paypal oauth routes
  app.route('/api/auth/paypal').get(users.oauthCall('paypal'));
  app.route('/api/auth/paypal/callback').get(users.oauthCallback('paypal'));

  // Setting the saml2 routes
  app.get('/login',
    passport.authenticate('saml',
      {
        successRedirect: '/dashboards',
        failureRedirect: '/login'
      })
  );
  app.post('/login/callback',
    passport.authenticate('saml',
      {
        failureRedirect: '/unknown-user',
        failureFlash: true
      }),
    function (req, res) {
      if(req.user.roles.indexOf('root') > -1 || req.user.roles.indexOf('partner') > -1) {
        res.redirect('/');
      } else {
        res.redirect('/dashboards');
      }
    }
  );

  app.get('/logout/callback', function(req, res){
    console.log("logout called");
    req.logout(); 
    res.redirect('/login'); 
  });
};
