'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Cluster = mongoose.model('ontap_clusters');

/**
 * Globals
 */
var user, cluster;

/**
 * Unit tests
 */
describe('Cluster Model Unit Tests:', function () {
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
      cluster = new Cluster({
        name: 'Cluster Title',
        key: 'cluster',
        management_ip:"10.20.30.40",
        provisioning_state:"open",
        rest_uri:"http://sample.com"
        user: user
      });

      done();
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      return cluster.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without name', function (done) {
      cluster.name = '';

      return cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without key', function (done) {
      cluster.key = '';

      return cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid key ie. 123a', function (done) {
      cluster.key = '';

      return cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. 123a', function (done) {
      cluster.code = '';

      return cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. Asdda', function (done) {
      cluster.code = '';

      return cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. asdd@a', function (done) {
      cluster.code = '';

      return cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

  });

  afterEach(function (done) {
    Cluster.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});
