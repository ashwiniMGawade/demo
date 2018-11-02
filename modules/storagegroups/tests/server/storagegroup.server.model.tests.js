'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    path = require('path'),
    featuresSettings = require(path.resolve('./config/features')),
    Server = mongoose.model('Server'),
    Subscription = mongoose.model('Subscription'),
    Pod = mongoose.model('Pod'),
    Site = mongoose.model('Site'),
    Storagegroup = mongoose.model('Storagegroup'),
    Tenant = mongoose.model('Tenant'),
    Subtenant = mongoose.model('Subtenant'),
    User = mongoose.model('User');

/**
 * Globals
 */
var user, site, pod, tenant, subtenant, server, storagegroup, tenant1, subscription;


/**
 * Unit tests
 */
describe('Storagegroup Model Unit Tests:', function () {
  this.timeout(5000);

  beforeEach(function (done) {
    user = new User({
      firstName: 'Test User',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      phone: '0823421453',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3',
      provider: 'raa',
      roles: ['admin']
    });

    pod = new Pod({
      name: 'TestPod',
      code: 'tpd'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
    });

    tenant = new Tenant({
      name: 'TestTenant',
      code: 'ttts',
    });

    tenant1 = new Tenant({
      name: 'tenant',
      code: 'ttttts',
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
      tenant1.annotation = 'test';
    }

    subtenant = new Subtenant({
      name: 'Test SubTenant',
      code: 'sssss',
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

    tenant.save(function(err){
      should.not.exist(err);
      user.tenant = tenant;
      user.save(function (err) {
      	should.not.exist(err);
        subtenant.tenant = tenant;
        subtenant.save(function(err){
          should.not.exist(err);
          site.save(function(err){
            should.not.exist(err);
            pod.site = site;
            pod.save(function(err){
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
                  managed: 'Portal',
                  subnet: '10.23.12.0/26',
                  code: 'testVfas',
                  status:'Operational',
                  subscription:subscription
                });
                server.save(function(err) {
                  should.not.exist(err);
                  storagegroup = new Storagegroup({
                    name: 'Test Storage group',
                    code: 'testsg',
                    server:server,
                    tier:'standard',
                    snapshotPolicy:'7daily1810',
                    user:user
                  });
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('Method Save', function () {

    it('should not be able to save the storagegroup if invalid server is provided', function (done) {
      this.timeout(20000);
      storagegroup.server = user._id;
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.server.message.should.be.equal('Invalid Server ID');
        done();
      });
    });

    it('should not be able to save the storagegroup if associated server does not belong to user tenant', function (done) {
      this.timeout(10000);
      tenant1.save(function(err) {
      	should.not.exist(err);
      	user.tenant = tenant1._id;
      	user.save(function(err){
        	should.not.exist(err);
          storagegroup.save(function (err) {
	          should.exist(err);
	          err.errors.server.message.should.be.equal('Invalid Server ID');
            tenant1.remove();
	          done();
        	});
      	});
      });
    });

    it('should be able to save & delete without problems', function (done) {
      this.timeout(10000);
      storagegroup.save(function (err) {
        should.not.exist(err);
        storagegroup.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to save & delete without problems with valid sanpshot policy Eg: 12hourly-7daily1810-5weekly-1monthly', function (done) {
      this.timeout(10000);
      storagegroup.snapshotPolicy = '12hourly-7daily1810-5weekly-1monthly';
      storagegroup.save(function (err) {
        should.not.exist(err);
        storagegroup.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to save & delete without problems with valid sanpshot policy Eg: 12hourly-7daily1810-1monthly', function (done) {
      this.timeout(10000);
      storagegroup.snapshotPolicy = '12hourly-7daily1810-1monthly';
      storagegroup.save(function (err) {
        should.not.exist(err);
        storagegroup.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to save & delete without problems with valid sanpshot policy Eg: 7daily0210', function (done) {
      this.timeout(10000);
      storagegroup.snapshotPolicy = '7daily0210';
      storagegroup.save(function (err) {
        should.not.exist(err);
        storagegroup.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should auto populate Tenant, subtenant', function (done) {
      this.timeout(10000);
      storagegroup.save(function (err) {
        should.not.exist(err);
        should.exist(storagegroup.tenant);
        should.exist(storagegroup.subtenant);
        storagegroup.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show error when try to save without storagegroup name', function (done) {
      this.timeout(10000);
      storagegroup.name = '';
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.name.message.should.be.equal('Storage Group name required');
        done();
      });
    });

    it('should be able to show error when try to save without storagegroup code', function (done) {
      this.timeout(10000);
      storagegroup.code = '';
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Storage Group code required');
        done();
      });
    });

    it('should be able to show error when try to save without storagegroup tier', function (done) {
      this.timeout(10000);
      storagegroup.tier = null;
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.tier.message.should.be.equal('Storage Group Tier required');
        done();
      });
    });

    it('should be able to show error when try to save without storagegroup snapshotPolicy', function (done) {
      this.timeout(10000);
      storagegroup.snapshotPolicy = null;
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.snapshotPolicy.message.should.be.equal('Storage Group Snapshot Policy is required');
        done();
      });
    });

    it('should be able to show error when storage unit code includes other than alphanumeric and underscoree.g: Storage Group%', function (done) {
      this.timeout(10000);
      storagegroup.code='Storage Group+@%';
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Storage Group code can only include alphanumeric(lowercase) & underscore (First Char must be alphabetical)');
        done();
      });
    });

    it('should be able to show error when storage unit name includes other than alphanumeric, space and dash.g: Storage Group%', function (done) {
      this.timeout(10000);
      storagegroup.name='Storageun+@it%';
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.name.message.should.be.equal('Storage Group name can only include alphanumeric, space & dash');
        done();
      });
    });

    it('should be able to show error when try to save with storagegroup name less than 3 chars', function (done) {
      this.timeout(10000);
      storagegroup.name = "te";
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.name.message.should.be.equal('Minimum 3 char required');
        done();
      });
    });

    it('should be able to show error when try to save with storagegroup code less than 3 chars', function (done) {
      this.timeout(10000);
      storagegroup.code = "te";
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Minimum 3 char required');
        done();
      });
    });

    it('should be able to show error when try to save with storagegroup code greater than 32 chars', function (done) {
      this.timeout(10000);
      storagegroup.code = "tesdfsdfsfsfdssfefdssdfddddddddddddddddd";
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Maximum 32 char allowed');
        done();
      });
    });


    it('should be able to show error when try to save with storagegroup tier other than allowed value', function (done) {
      this.timeout(10000);
      storagegroup.tier = 'test';
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.tier.message.should.be.equal('`test` not a valid value for Tier');
        done();
      });
    });

    it('should be able to show error when try to save with storagegroup snapshotPolicy other than allowed value', function (done) {
      this.timeout(10000);
      storagegroup.snapshotPolicy = 'test';
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.snapshotPolicy.message.should.be.equal('Invalid SnapshotPolicy');
        done();
      });
    });

    it('should be able to show error when try to save with storagegroup status other than allowed value', function (done) {
      this.timeout(10000);
      storagegroup.status = 'test';
      storagegroup.save(function (err) {
        should.exist(err);
        err.errors.status.message.should.be.equal('`test` not a valid value for Status');
        done();
      });
    });


    it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);
      var obj = JSON.stringify(storagegroup);
      should.not.exist(obj.__v);
      should.not.exist(obj.created);
      should.not.exist(obj._id);
      should.not.exist(obj.user);
      done();
    });
  });

  // afterEach(function (done) {
  //   Server.remove().exec(function () {
  //     pod.remove();
  //     site.remove();
  //     Server.remove();
  //     Storagegroup.remove();
  //     Subtenant.remove();
  //     tenant.remove();
  //     tenant.remove();
  //     tenant1.remove();
  //     User.remove().exec(done);
  //   });
  // });

  afterEach(function (done) {
    User.remove().exec(function () {
      Subtenant.remove().exec(function(){
        Tenant.remove().exec(function () {
          Pod.remove().exec(function() {
            Site.remove().exec(function(){
              Subscription.remove().exec(function() {
                Server.remove().exec(function(){
                  pod.remove();
                  Storagegroup.remove().exec(done);
                });
              });
            });
          });
        });
      });
    });
  });
});
