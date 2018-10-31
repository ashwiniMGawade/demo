'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Site = mongoose.model('Site');

/**
 * Globals
 */
var user, site;

/**
 * Unit tests
 */
describe('Site Model Unit Tests:', function () {

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
      site = new Site({
        name: 'Site Title',
        code: 'site',
        user: user
      });

      done();
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      site.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without name', function (done) {
      site.name = '';

      site.save(function (err) {
        should.exist(err);
        done();
      });
    });
    
    it('should be able to show an error when try to save without code', function (done) {
      site.code = '';

      site.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. 1234a', function (done) {
      site.code = '1234a';

      site.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. 123_', function (done) {
      site.code = '123_';

      site.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. Asdd', function (done) {
      site.code = 'Asdd';

      site.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid code ie. ad@a', function (done) {
      site.code = 'ad@a';

      site.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });

  afterEach(function (done) {
    Site.remove().exec(function () {
      site.remove();
      User.remove().exec(done);
    });
  });
});
