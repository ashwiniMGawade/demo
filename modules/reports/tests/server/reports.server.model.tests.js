'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  Tenant = mongoose.model('Tenant'),
  Reports = require('../../server/models/reports.server.model');

/**
 * Globals
 */
var report;
var fs = require('fs'),
  rmdir = require('rmdir'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  _tenant1, _tenant2;

var dir = config.reports.storage_path;

/**
 * Unit tests
 */
describe('Report Model Unit Tests:', function () {

  beforeEach(function (done) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    if (!fs.existsSync(dir + 'a12345/')) {
      fs.mkdirSync(dir + 'a12345/');
    }

    fs.writeFile(dir + 'a12345/' + 'dfassreport_a12345_20160403.xsv', '', function () {

    });

    _tenant1 = new Tenant({
      code:'a12345',
      name:'testTenant1'
    });
    _tenant2 = new Tenant({
      code:'a456',
      name:'testTenant2'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      _tenant1.annotation = 'test';
      _tenant2.annotation = 'test';
    }


    _tenant1.save(function(err) {
      Tenant.findById(_tenant1._id).exec(function (err, tenant) {
        done();
      });
    });

  });

  describe('Method List', function () {
    it('should be able to list the reports', function (done) {
      return Reports.list(_tenant1._id, 20160401, 20160404, function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should throw error if file not found or directory doesnt exist.', function (done) {
      return Reports.list('a456', 20160401, 20160404, function (err) {
        should.exist(err);
        done();
      });
    });

    it('should return error if tenant doesnt exist', function (done) {
      return Reports.list(mongoose.Types.ObjectId(), 20160401, 20160404, function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to list latest 30 reports if start and end is not specified', function (done) {
      return Reports.list(_tenant1._id, '', '', function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should return empty array if no file is between start and end date', function (done) {
      return Reports.list(_tenant1._id, 20160301, 20160302, function (err, files) {
        should.not.exist(err);
        should(files.length).be.equal(0);
        done();
      });
    });
  });

  describe('Method Read', function () {
    it('should give error if file not found', function (done) {
      return Reports.read('test', function (err) {
        should.exist(err);
        done();
      });
    });

    it('should read file if present', function (done) {
      return Reports.read('dfassreport_a12345_20160403.xsv', function (err) {
        should.not.exist(err);
        done();
      });
    });
  });


  afterEach(function (done) {
    Tenant.remove().exec(function(){
      rmdir('reports/a12345', function (err, dirs, files) {
        done();
      });
    });
  });

});
