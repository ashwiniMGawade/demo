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
        name: 'cluster',
        uuid: '19158fba-d063-11e8-b4c4-005056a8f8ff',
        management_ip:"10.20.30.40",
        provisioning_state:"open",
        rest_uri:"http://sample.com",
        user: user
      });

      done();
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      cluster.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without name', function (done) {
      cluster.name = '';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without uuid', function (done) {
      cluster.uuid = '';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without management_ip', function (done) {
      cluster.management_ip = '';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without provisioning_state', function (done) {
      cluster.provisioning_state = '';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should not be able to show an error when try to save without rest_uri', function (done) {
      cluster.rest_uri = '';

      cluster.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid name ie. abc a', function (done) {
      cluster.name = 'abc a';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid uuid ie. abc-a1212-121', function (done) {
      cluster.uuid = 'abc-a1212-121';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid management_ip ie. 121212', function (done) {
      cluster.management_ip = '121212';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid management_ip ie. 10.23.767.10', function (done) {
      cluster.management_ip = '10.23.767.10';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid provisioning_state ie. broken', function (done) {
      cluster.provisioning_state = 'broken';

      cluster.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to add apis_cluster_key with proper data when successfully saved', function (done) {
      
      cluster.save(function (err) {
        should.not.exist(err);
        should.exist(cluster.apis_cluster_key);
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
