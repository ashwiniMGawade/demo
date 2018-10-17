'use strict';

/**
 * Module dependencies.
 */
var jobsPolicy = require('../policies/jobs.server.policy'),
  jobs = require('../controllers/jobs.server.controller'),
  path=require('path'),
  auth = require(path.resolve('./modules/users/server/controllers/users/users.authentication.server.controller'));

module.exports = function (app) {
  // Icms collection routes
  app.route('/api/jobs').all([auth.loginODIN, jobsPolicy.isAllowed])
    .get(jobs.list);

  // Single job routes
  app.route('/api/jobs/:jobId').all([auth.loginODIN, jobsPolicy.isAllowed])
    .get(jobs.read);

  // Finish by binding the job middleware
  app.param('jobId', jobs.jobByID);
};
