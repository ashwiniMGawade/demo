'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Site = mongoose.model('Site'),
  Pod = mongoose.model('Pod'),
  Job = mongoose.model('Job'),
  Subscription = mongoose.model('Subscription'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a site
 */
exports.create = function (req, res) {
  var site = new Site();
  site.name = req.body.name;
  site.code = req.body.code;
  site.user = req.user;

  site.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Job.create(req, 'site', function(err, createJobRes) {
        createJobRes.update('Completed', 'Site Saved', site);
      });
      res.json(site);
    }
  });
};

/**
 * Show the current site
 */
exports.read = function (req, res) {
  res.json(req.site);
};

/**
 * Update a site
 */
exports.update = function (req, res) {
  var site = req.site;
  site.name = req.body.name;

  site.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Job.create(req, 'site', function(err, updateJobRes) {
        updateJobRes.update('Completed', 'Site Updated', site);
      });
      res.json(site);
    }
  });
};

/**
 * Delete a site
 */
exports.delete = function (req, res) {
  var site = req.site;


  //check for pod dependancy
  Pod.find({ 'site' : mongoose.Types.ObjectId(site._id) }).exec(function (err, pods) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if(pods.length > 0) {
        return res.status(400).send({
          message: 'Can\'t perform Delete: Please ensure all associated pods are deleted'
        });
      } else {
         Subscription.find({ 'site' : mongoose.Types.ObjectId(site._id) }).exec(function (err, subscriptions) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            if(subscriptions.length > 0) {
              return res.status(400).send({
                message: 'Can\'t perform Delete: Please ensure all associated subscriptions are deleted!'
              });
            } else {
              site.remove(function (err) {
                if (err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  Job.create(req, 'site', function(err, deleteJobRes) {
                    deleteJobRes.update('Completed', 'Site Deleted', site);
                  });
                  res.json({});
                }
              });
            }
          }
        });
      }
    }
  });
};

/**
 * List of Sites
 */
exports.list = function (req, res) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  Site.find().exec(function (err, sites) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(sites);
    }
  });
};

/**
 * Site middleware
 */
exports.siteByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Site is invalid'
    });
  }

  Site.findById(id).exec(function (err, site) {
    if (err) {
      return next(err);
    } else if (!site) {
      return res.status(404).send({
        message: 'No site with that identifier has been found'
      });
    }
    req.site = site;
    next();
  });
};
