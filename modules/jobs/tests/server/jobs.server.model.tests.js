'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  User = mongoose.model('User'),  
  Job = mongoose.model('Job'),
  Pod = mongoose.model('Pod'),
  Site = mongoose.model('Site'),
  Subtenant = mongoose.model('Subtenant'),
  Subscription = mongoose.model('Subscription'),
  Server = mongoose.model('Server'),
  Tenant = mongoose.model('Tenant');

/**
 * Globals
 */
var user, tenant, job, server, pod, subtenant, site, server, subscription;

/**
 * Unit tests
 */
describe('Jobs Model Unit Tests:', function () {
  this.timeout(5000);
  beforeEach(function (done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3',
      roles: ['admin'],
      provider:'raa'
    });
    tenant = new Tenant({
      name: 'Tenant Name',
      code: 'ttttst'
    });
    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
    }

    tenant.save(function (err) {
      should.not.exist(err);
      user.tenant = tenant;     
      user.save(function(err){
        job = new Job({
          user: user,          
          tenant: tenant,
          operation:'Create',
          module:'job',
          payload:{}
        });   
        done();     
      });
    });  
  });

  describe('Method Save', function () {
    it('should be able to save & delete without problems', function (done) {
      job.save(function (err) {
        should.not.exist(err);
        job.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save without job operation', function (done) {
      job.operation = '';
      job.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without job user', function (done) {
      job.user = null;
      job.save(function (err, jobRes) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid status', function (done) {
      job.status = 'test';
      job.save(function (err) {
        should.exist(err);
        done();
      });
    });

    // it('should be able to show an error when try to save job with invalid tenant id', function (done) {
    //   job.tenant = 'test';
    //   job.save(function (err) {
    //     should.exist(err);
    //     done();
    //   });
    // });


    // it('should be able to show an error when try to save job with invalid tenant id', function (done) {
    //   job.tenant = user._id;
    //   job.save(function (err) {
    //     should.exist(err);
    //     done();
    //   });
    // });

    it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);   
      job.save(function (err, jobres) {
        should.not.exist(err);  
        var obj = JSON.stringify(jobres);
        should.not.exist(obj.__v);
        should.not.exist(obj.created);
        should.not.exist(obj._id);
        should.not.exist(obj.user);
        done();
      });
    });
   
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      //Tenant.remove().exec(done);
      Tenant.remove().exec(function() {
        Job.remove().exec(done);
      });
    });
  });
});
