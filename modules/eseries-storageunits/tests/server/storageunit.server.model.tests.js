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
    Storageunit = mongoose.model('Storageunit'),
    Tenant = mongoose.model('Tenant'),
    Subtenant = mongoose.model('Subtenant'),
    User = mongoose.model('User');

/**
 * Globals
 */
var user, site, pod, tenant, subtenant, server, storagegroup, storageunit, subscription;

/**
 * Unit tests
 */
describe('Storage Unit Model Unit Tests:', function () {

  beforeEach(function (done) {
    this.timeout(10000);
    user = new User({
      firstName: 'Test User',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      phone: '0823421453',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3',
      provider: 'local',
      roles: ['root']
    });

    pod = new Pod({
      name: 'Test Pod',
      code: 'tpd'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
    });

    tenant = new Tenant({
      name: 'Test Tenant',
      code: 'ttttt',
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
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

    user.save(function () {
      tenant.save(function(err){
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
                  nfs:true,
                  iscsi:true,
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
                    status:'Operational'
                  });
                  storagegroup.save(function(err) {
                    should.not.exist(err);
                    storageunit = new Storageunit({
                      name: 'test storage unit',
                      code: 'testsuss',
                      protocol: 'nfs',
                      sizegb:100,
                      storagegroup:storagegroup
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
  });

  describe('Method Save', function () {

    // it('should not be able to save the storageunit if associated server is customer managed', function (done) {
    //   this.timeout(10000);
    //   server.managed = 'Customer';
    //   server.save(function(err){
    //     should.not.exist(err);
    //     storageunit.save(function (err, storageunit) {
    //       console.log(storageunit);
    //       should.exist(err);
    //       err.message.should.be.equal('Storageunit validation failed');
    //       err.errors.storagegroup.message.should.be.equal('Storagegroup belongs to Customer managed Server');
    //       done();
    //     });
    //   });
    // });

    it('should not be able to save the storageunit if associated server is does not support the protocol', function (done) {
      this.timeout(10000);
      storageunit.protocol = 'cifs';
      server.save(function(err){
        should.not.exist(err);
        storageunit.save(function (err) {
          should.exist(err);
          err.errors.storagegroup.message.should.be.equal('Storagegroup\'s Server is not enabled for specified Protocol');
          done();
        });
      });
    });

    it('should not be able to save the storageunit if invalid storagegroup is provided', function (done) {
      this.timeout(20000);
      storageunit.storagegroup = server._id;
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.storagegroup.message.should.be.equal('Invalid Storagegroup ID');
        done();
      });
    });

    it('should not be able to save the storageunit if invalid acl is provided, ie 1.1.1', function (done) {
      this.timeout(20000);
      storageunit.acl = "1.1.1";
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.acl.message.should.be.equal('Invalid ACL');
        done();
      });
    });

    it('should not be able to save the storageunit if invalid acl is provided, ie 12.122.123.121,', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'nfs';
      storageunit.acl = "12.122.123.121,";
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.acl.message.should.be.equal('Invalid ACL');
        done();
      });
    });

    it('should not be able to save the storageunit if invalid acl is provided, ie 12.122.123.121/45', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'nfs';
      storageunit.acl = "12.122.123.121/45";
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.acl.message.should.be.equal('Invalid ACL');
        done();
      });
    });

    it('should not be able to save the storageunit if invalid acl is provided ie. iqn.1992-05.com::', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'iscsi';
      storageunit.acl = "iqn.1992-05.com::";
      storageunit.save(function (err) {
        should.exist(err);       
        done();
      });
    });

    it('should not be able to save the storageunit if invalid acl is provided ie. iqn.1992-05.com:servername,', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'iscsi';
      storageunit.acl = "iqn.1992-05.com:servername,";
      storageunit.save(function (err) {
        should.exist(err);       
        done();
      });
    });

    it('should be able to save the storageunit if valid acl is provided ie. iqn.1992-05.com.microsoft:servername,iqn.1992-05.com.microsoft:servername', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'iscsi';
      storageunit.acl = "iqn.1992-05.com.microsoft:servername,iqn.1992-05.com.microsoft:servername";
      storageunit.save(function (err) {
        should.not.exist(err);       
        done();
      });
    });

    it('should be able to save the storageunit if valid acl is provided ie. 12.121.121.121,12.121.121.121', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'nfs';
      storageunit.acl = "12.121.121.121,12.121.121.121";
      storageunit.save(function (err) {
        should.not.exist(err);       
        done();
      });
    });

    it('should be able to save the storageunit if valid acl is provided ie. 12.121.121.121,12.121.121.121', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'nfs';
      storageunit.acl = "12.121.121.121/12,12.121.121.121";
      storageunit.save(function (err) {
        should.not.exist(err);       
        done();
      });
    });

    it('should be able to save the storageunit if valid acl is provided ie. 12.121.121.121,12.121.121.121', function (done) {
      this.timeout(20000);
      storageunit.protocol = 'nfs';
      storageunit.acl = "12.121.121.121/12,12.121.121.121/12";
      storageunit.save(function (err) {
        should.not.exist(err);       
        done();
      });
    });



    it('should not be able to save the storageunit if associated server and storage group is not operational', function (done) {
      this.timeout(10000);
      server.status = 'Operational';
      server.save(function(err){
        should.not.exist(err);
        storagegroup.status='Creating';
        storagegroup.save(function(err){
          should.not.exist(err);
          storageunit.save(function (err) {
            should.exist(err);
            err.errors.storagegroup.message.should.be.equal('Storage Group needs to be Operational');
            done();
          });
        });
      });
    });

    it('should not be able to save the storageunit if storage unit name is already exists', function (done) {
      this.timeout(10000);

      storageunit.save(function (err) {
        should.not.exist(err);

        var storageunit2 = new Storageunit({
          name: storageunit.name,
          code: 'testsu',
          protocol: 'cifs',
          sizegb:100,
          storagegroup:storagegroup,
          server:server
        });

        storageunit2.save(function(err){
          should.exist(err);
          storageunit2.remove();
          done();
        });
      });
    });

    it('should be able to save & delete without problems', function (done) {
      this.timeout(10000);
      storageunit.save(function (err) {
        should.not.exist(err);
        storageunit.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should auto populate Tenant, Server, Subtenant during save', function (done) {
      this.timeout(10000);
      storageunit.save(function (err) {
        should.not.exist(err);
        should.exist(storageunit.tenant);
        should.exist(storageunit.server);
        should.exist(storageunit.subtenant);
        storageunit.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show error when try to save without storageunit name', function (done) {
      this.timeout(10000);
      storageunit.name = '';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.name.message.should.be.equal('Storage Unit name required');
        done();
      });
    });

    it('should be able to show error when try to save without storageunit code', function (done) {
      this.timeout(10000);
      storageunit.code = '';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Storage Unit code required');
        done();
      });
    });

    it('should be able to show error when try to save without storageunit size', function (done) {
      this.timeout(10000);
      storageunit.sizegb = null;
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.sizegb.message.should.be.equal('Storage Unit size required');
        done();
      });
    });

    it('should be able to show error when try to save with invalid interger storageunit size', function (done) {
      this.timeout(10000);
      storageunit.sizegb = 111.11;
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.sizegb.message.should.be.equal('111.11 is not an integer value for size');
        done();
      });
    });

    it('should be able to show error when try to save without storageunit protocol', function (done) {
      this.timeout(10000);
      storageunit.protocol = null;
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.protocol.message.should.be.equal('Storage Unit protocol required');
        done();
      });
    });

    it('should be able to show error when storage unit code includes other than alphanumeric and underscoree.g: Storageunit%', function (done) {
      this.timeout(10000);
      storageunit.code='Storageunit+@%';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Storage Unit code can only include lowercase alphanumeric characters and underscores (First character must be alphabetical)');
        done();
      });
    });

    it('should be able to show error when storage unit code contains less than 3 chars', function (done) {
      this.timeout(10000);
      storageunit.code='su';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Storage unit code, Minimum 3 char required');
        done();
      });
    });

    it('should be able to show error when storage unit code contains more than 32 chars', function (done) {
      this.timeout(10000);
      storageunit.code='suasdfasdfasdfasdfasdfasdfsadfasfdasdfsadfasdfasdfsdafasdfasdfd';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.code.message.should.be.equal('Storage unit code, Maximum 32 char allowed');
        done();
      });
    });

    it('should be able to show error when storage unit name includes other than alphanumeric, space and dash.g: Storageunit%', function (done) {
      this.timeout(10000);
      storageunit.name='Storageun+@it%';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.name.message.should.be.equal('Name can only include dash, space and alphanumeric characters');
        done();
      });
    });

    it('should be able to show error when storage unit name contains less than 3 chars', function (done) {
      this.timeout(10000);
      storageunit.name='su';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.name.message.should.be.equal('Storage unit name, Minimum 3 char required');
        done();
      });
    });

    it('should be able to show error when storage unit name contains more than 64 chars', function (done) {
      this.timeout(10000);
      storageunit.name='suasdfasdfasdfasdfasdfasdfsadfasfdasdfsadfasdfasdfdfgdgdfsgsdgsdfgsdfgsdfgsdffgssdafasdfasdfd';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.name.message.should.be.equal('Storage unit name, Maximum 64 char allowed');
        done();
      });
    });

    it('should be able to show error when try to save with storageunit size less than 100', function (done) {
      this.timeout(10000);
      storageunit.sizegb = 98;
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.sizegb.message.should.be.equal('Storage Unit Size should be greater than or equal to 100');
        done();
      });
    });

     it('should be able to show error when try to save with storageunit size greater than 16384', function (done) {
      this.timeout(10000);
      storageunit.sizegb = 16385;
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.sizegb.message.should.be.equal('Storage Unit Size should be lesser than or equal to 16384');
        done();
      });
    });


    it('should be able to show error when try to save with storageunit protocol other than allowed value', function (done) {
      this.timeout(10000);
      storageunit.protocol = 'test';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.protocol.message.should.be.equal('`test` not a valid value for protocol');
        done();
      });
    });

    it('should be able to show error when try to save with storageunit lunos other than allowed value', function (done) {
      this.timeout(10000);
      storageunit.lunOs = 'test';
      storageunit.protocol = 'iscsi';
      storageunit.save(function (err) {
        should.exist(err);
        err.errors.lunOs.message.should.be.equal('`test` not a valid value for lunOS');
        done();
      });
    });

     it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);
      var obj = JSON.stringify(storageunit);
      should.not.exist(obj.__v);
      should.not.exist(obj.created);
      should.not.exist(obj._id);
      should.not.exist(obj.user);
      //should.exist(obj.storageunitId);
      done();
    });
  });

  afterEach(function (done) {
    User.remove().exec(function() {
      Tenant.remove().exec(function() {
        Subtenant.remove().exec(function() {
          Server.remove().exec(function () {
            Pod.remove().exec(function() {
              Site.remove().exec(function() {
                Subscription.remove().exec(function() {
                  Storagegroup.remove().exec(function() {
                    Storageunit.remove().exec(done);
                  });
                });
              });
            });
          });
        });
      });
    }); 
  });
});
