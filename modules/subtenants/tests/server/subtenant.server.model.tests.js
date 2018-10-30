'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  User = mongoose.model('User'),
  Subtenant = mongoose.model('Subtenant'),
  Tenant = mongoose.model('Tenant');

/**
 * Globals
 */
var user, subtenant, subtenant2, tenant;

/**
 * Unit tests
 */
describe('Subtenant Model Unit Tests:', function () {

  beforeEach(function (done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3',
      roles: ['admin']
    });

    tenant = new Tenant({
      name: 'Test Tenant',
      code: 'ttttt',
    });
    
    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
    }
    

    user.save(function () {
      tenant.save(function(err){
        should.not.exist(err);
        
        subtenant = new Subtenant({
          name: 'Subtenant Name',
          code: 'tttt',
          user: user,
          tenant: tenant

        });
        subtenant2 = new Subtenant({
          name: 'Subtenant Name',
          code: 'TTTTT',
          user: user,
          tenant: tenant
        });
        done();
      });
    });
  });

  describe('Method Save', function () {
    it('should be able to save & delete without problems', function (done) {
      this.timeout(20000);
      subtenant.save(function (err) {
        should.not.exist(err);
        subtenant.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save without subtenant code', function (done) {
      subtenant.code = '';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without subtenant name', function (done) {
      subtenant.name = '';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without tenant name', function (done) {
      subtenant.tenant = '';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save duplicate subtenant code', function (done) {
      subtenant.save(function () {
        subtenant2.save(function (err) {
          should.exist(err);
          subtenant.remove(function (err) {
            should.not.exist(err);
            done();
          });
        });
      });
    });

    it('should be able to show an error when try to save subtenant code less than 3 char', function (done) {
      subtenant.code = 'TT';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save invalid subtenant code ie. 123:', function (done) {
      subtenant.code = '123:';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save invalid subtenant code ie. a123A', function (done) {
      subtenant.code = 'a123A';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save invalid subtenant code ie. a123@', function (done) {
      subtenant.code = 'a123@';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save subtenant code more than 8 char', function (done) {
      subtenant.code = 'TTTTTTTTT';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save subtenant name more than 64 char', function (done) {
      subtenant.name = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT';
      subtenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

  });

  afterEach(function (done) {
    Subtenant.remove().exec(function () {
      tenant.remove();
      User.remove().exec(done);
    });
  });
});
