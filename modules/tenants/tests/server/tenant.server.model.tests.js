'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant');

/**
 * Globals
 */
var user, tenant, tenant2;

/**
 * Unit tests
 */
describe('Tenant Model Unit Tests:', function () {

  beforeEach(function (done) {
    this.timeout(5000);
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    user.save(function () {
      tenant = new Tenant({
        name: 'Test Tenant',
        code: 'ttttt',
        user: user
      });

      tenant2 = new Tenant({
        name: 'Test Tenant2',
        code: 'tttts',
        user: user
      });

      //initialize annotation when setting is enabled
      if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
        tenant.annotation = 'test';
        tenant2.annotation = 'test';
      }
      done();
    });
  });

  describe('Method Save', function () {
    it('should be able to save & delete without problems', function (done) {
      this.timeout(10000);
      tenant.save(function (err) {
        should.not.exist(err);
        tenant.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save without tenant code', function (done) {
      tenant.code = '';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without tenant name', function (done) {
      tenant.name = '';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });


    it('should be able to show an error when try to save duplicate tenant code', function (done) {
      tenant.save(function () {
        tenant2.code = tenant.code;
        tenant2.save(function (err) {
          should.exist(err);
          tenant.remove(function (err) {
            should.not.exist(err);
            done();
          });
        });
      });
    });

    it('should be able to show an error when try to save tenant code less than 3 char', function (done) {
      tenant.code = 'TT';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save tenant code more than 8 char', function (done) {
      tenant.code = 'TTTTTTTTT';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save tenant name more than 64 char', function (done) {
      tenant.name = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save tenant name less than 3 char', function (done) {
      tenant.name = 'TT';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });
   
    it('should be able to show an error when try to save tenant annotation more than 32 char', function (done) {
      tenant.annotation = 'test121145test121145test121145test121145test121145test121145test121145test121145test121145test121145test121145test121145test121145test121145';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });


    it('should be able to show an error when try to save tenant name with disallowed special chars', function (done) {
      tenant.name = '@TTs';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });


    it('should be able to show an error when try to save tenant code with disallowed special chars', function (done) {
      tenant.code = '@!s';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save Invalid tenant code ie: 123:', function (done) {
      tenant.code = '123:';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save Invalid tenant code ie: a123A', function (done) {
      tenant.code = 'a123A';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save Invalid tenant code ie: a123@', function (done) {
      tenant.annotation = 'a123@';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save Invalid tenant annotation ie: @test', function (done) {
      tenant.code = '@test';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should not be able to save the tenant if tenant name is already exists', function (done) {
      this.timeout(10000); 

      tenant.save(function (err) {
        should.not.exist(err); 

        var tenant2 = new Tenant({
          name: tenant.name,
          code: 'code001',
          user: user
        });

        tenant2.save(function(err){
          should.exist(err);
          tenant2.remove();        
          done();
        });        
      });
    });

    it('should be able to show an error when try to save Invalid partner id: ie. test', function (done) {
      this.timeout(10000);
      tenant.partner = 'test';
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save Invalid partner id', function (done) {
      this.timeout(10000);
      tenant.partner = mongoose.Types.ObjectId(user._id);
      tenant.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to save with valid partner id', function (done) {    
      this.timeout(10000);  
      tenant2.save(function (err) {
        should.not.exist(err);
        tenant.partner = mongoose.Types.ObjectId(tenant2._id);
        tenant.save(function(err) {
           should.not.exist(err);
           tenant2.remove();
           done();
        });        
      });
    });

    it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);
      var obj = JSON.stringify(tenant);
      should.not.exist(obj.__v);
      should.not.exist(obj.created);
      should.not.exist(obj._id);
      should.not.exist(obj.user);
      //should.exist(obj.storageunitId);
      done();
    });

  });

  afterEach(function (done) {
    Tenant.remove().exec(function () {
      User.remove().exec(done);
    });
  });

});
