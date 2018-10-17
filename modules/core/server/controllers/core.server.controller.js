'use strict';

var path = require('path'),
featureSettings = require(path.resolve('./config/features'));
/**
* getClientSideFeatureSettings
* Currently its returning all content of features..can be modified to return only needed
* settings
*/
var getClientSideFeatureSettings = function(){
  return featureSettings;
};


/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  res.render('modules/core/server/views/index', {
    user: req.user || null,
    year: new Date().getFullYear(),
    featuresSettings: getClientSideFeatureSettings(),
    expiryTime: ( process.env.SESSION_EXPIRATION_TIME_IN_MINUTES || 60) * 60 * 1000
  });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};
