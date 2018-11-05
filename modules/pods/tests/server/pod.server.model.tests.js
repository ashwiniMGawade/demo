'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Pod = mongoose.model('Pod');

/**
 * Globals
 */
var user, pod;

/**
 * Unit tests
 */
describe('Pod Model Unit Tests:', function () {
  this.timeout(5000);
  beforeEach(function (done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    user.save(function () {
      pod = new Pod({
        name: 'Pod Title',
        code: 'pod',
        user: user
      });

      done();
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      pod.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without name', function (done) {
      pod.name = '';

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without code', function (done) {
      pod.code = '';

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. 123a', function (done) {
      pod.code = '';

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. 123a', function (done) {
      pod.code = '';

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. Asdda', function (done) {
      pod.code = '';

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. asdd@a', function (done) {
      pod.code = '';

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid site ie. asdd@a', function (done) {
      pod.site = 'asdd@a';

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid cluster_keys ie. ["asdd@a"]', function (done) {
      pod.site = ['asdd@a'];

      pod.save(function (err) {
        should.exist(err);
        done();
      });
    });

  });

  afterEach(function (done) {
    Pod.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});
