'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  User = mongoose.model('User'),  
  Icr = mongoose.model('Icr'),
  Pod = mongoose.model('Pod'),
  Site = mongoose.model('Site'),
  Subtenant = mongoose.model('Subtenant'),
  Subscription = mongoose.model('Subscription'),
  Server = mongoose.model('Server'),
  Tenant = mongoose.model('Tenant');

/**
 * Globals
 */
var user, tenant, icr, server, pod, subtenant, site, server, subscription;

/**
 * Unit tests
 */
describe('ICRS Model Unit Tests:', function () {
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

    pod = new Pod({
      name: 'Test Pod',
      code: 'tpd'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
    }); 

    subscription = new Subscription({
      name: 'test subscription',
      code: 'testsub',
      url: 'http://test.com',
      description: 'this is the test subscription'
    });

    //initialize subscription pack when prepaid payment method setting is enabled
    if (featuresSettings.paymentMethod.prePaid) {
      subscription.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
    }

    subtenant = new Subtenant({
      name: 'Test SubTenant',
      code: 'sssss'
    });

    site.save(function(err){
      should.not.exist(err);
      pod.site = site;
      pod.save(function(err){

      });
    });

    tenant.save(function (err) {
      should.not.exist(err);
      user.tenant = tenant;     
      user.save(function(err){
        should.not.exist(err);
        subtenant.tenant = tenant;
        subtenant.save(function(err){
          should.not.exist(err);
          subscription.site = site;  
          subscription.tenant = tenant; 
          subscription.save(function(err) {
            should.not.exist(err);
            server = new Server({
              name: 'Test VFas',
              site: site,
              pod: pod,
              subtenant: subtenant,
              managed: 'Customer',
              subnet: '10.23.12.0/26',
              code: 'testVfas',
              status:'Operational',
              subscription: subscription
            });
            server.save(function(err) {
              should.not.exist(err);
              icr = new Icr({
                user: user,
                message: 'test message',
                clusterExt: 'test cluster text',
                ipsExt: '10.20.30.40, 45.12.34.12',
                tenant: tenant,
                server:server
              });
              done();
            });
          });
        });
      });
    });  
  });

  describe('Method Save', function () {
    it('should be able to save & delete without problems', function (done) {
      icr.save(function (err) {
        should.not.exist(err);
        icr.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save without icr message', function (done) {
      icr.message = '';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without icr cluster text', function (done) {
      icr.clusterExt = '';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without icr external IPs', function (done) {
      icr.ipsExt = '';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without icr server', function (done) {
      icr.server = null;
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without icr tenant', function (done) {
      icr.tenant = null;
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid status', function (done) {
      icr.status = 'test';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save icr message less than 3 char', function (done) {
      icr.message = 'TT';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save icr message more than 1024 char', function (done) {
      icr.message = 'TTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTT';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save icr message with invalid content eg. test@', function (done) {
      icr.message = 'test@';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save icr clusterExt more than 64 char', function (done) {
      icr.clusterExt = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save icr ipsExt more than 128 char', function (done) {
      icr.ipsExt = '10.20.30.14, 10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,10.20.30.14,';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save icr with invalid tenant id', function (done) {
      icr.tenant = 'test';
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });


    it('should be able to show an error when try to save icr with invalid tenant id', function (done) {
      icr.tenant = user._id;
      icr.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);   
      icr.save(function (err, icrres) {
        should.not.exist(err);  
        var obj = JSON.stringify(icrres);
        should.not.exist(obj.__v);
        should.not.exist(obj.created);
        should.not.exist(obj._id);
        should.not.exist(obj.user);
        done();
      });
    });

    it('should not be able to save the ICR if associated server is portal managed', function (done) {
      this.timeout(10000);
      server.managed = 'Portal';
      server.save(function(err){
        should.not.exist(err);  
        icr.save(function (err, icrres) {
          should.exist(err);
          done();
        });
      }); 
    });

  });

  afterEach(function (done) {
    User.remove().exec(function () {
      //Tenant.remove().exec(done);
      Tenant.remove().exec(function() {
        Subtenant.remove().exec(function() {
          Site.remove().exec(function() {
            Pod.remove().exec(function() {
              Subscription.remove().exec(function() {
                Server.remove().exec(function() {
                  Icr.remove().exec(done);
                });
              });
            });
          });
        });
      });
    });
  });
});
