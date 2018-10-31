'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    path = require('path'),
    featuresSettings = require(path.resolve('./config/features')),
    User = mongoose.model('User'),
    Pod = mongoose.model('Pod'),
    Site = mongoose.model('Site'),
    Tenant = mongoose.model('Tenant'),
    Subtenant = mongoose.model('Subtenant'),
    Subscription = mongoose.model('Subscription'),
    Server = mongoose.model('Server');

/**
 * Globals
 */
var user, site, pod, tenant, subtenant, server, subscription, _tenant, _site;

/**
 * Unit tests
 */
describe('Server Model Unit Tests:', function () {

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
      provider: 'local'
    });

    pod = new Pod({
      name: 'Test Pod',
      code: 'tpd'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
    });

    _site = new Site({
      name: 'Test Site new',
      code: 'tstn'
    });


    tenant = new Tenant({
      name: 'Test Tenant',
      code: 'ttttt',
    });

    _tenant = new Tenant({
      name: 'Test Tenant new',
      code: 'tttts',
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
      _tenant.annotation = 'test';
    }

    _tenant.save(function(err) {
      should.not.exist(err);
      _site.save(function(err) {
        should.not.exist(err);
      });
    });


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
      tenant.save(function() {
        subtenant.tenant = tenant;
        subtenant.save(function() {
          site.save(function() {
            pod.site = site;
            pod.save(function() {
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
                  subscription: subscription,
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

  describe('Method Save', function () {
    it('should be able to save & delete without problems', function (done) {
      this.timeout(10000);
      server.save(function (err) {
        should.not.exist(err);
        server.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should auto populate Tenant & vLans during save', function (done) {
      this.timeout(10000);
      server.save(function (err) {
        should.not.exist(err);
        should.exist(server.tenant);
        should.exist(server.vlan);
        server.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should give error when vlan is non-integer value', function (done) {
      this.timeout(10000);
      server.vlan = 11.11;
      server.save(function (err) {
        console.log(err);
        should.exist(err);
        done();
      });
    });

    it('should save server when vlan is integer value', function (done) {
      this.timeout(10000);
      server.vlan = 11;
      server.save(function (err) {
        console.log(err);
        console.log(server.vlan);
        should.not.exist(err);
        done();
      });
    });

    it('should give error when ipVirtClus is Invalid IP', function (done) {
      this.timeout(10000);
      server.ipVirtClus = 11.11;
      server.save(function (err) {
        console.log(err);
        should.exist(err);
        done();
      });
    });

    it('should save server when ipVirtClus is valid IP', function (done) {
      this.timeout(10000);
      server.ipVirtClus = '11.11.11.11';
      server.save(function (err) {
        console.log(err);
        console.log(server.vlan);
        should.not.exist(err);
        done();
      });
    });

    it('should give error when ipMgmt is Invalid IP', function (done) {
      this.timeout(10000);
      server.ipVirtClus = 11.11;
      server.save(function (err) {
        console.log(err);
        should.exist(err);
        done();
      });
    });

    it('should save server when ipMgmt is valid IP', function (done) {
      this.timeout(10000);
      server.ipMgmt = ' 11.11.11.11';
      server.save(function (err) {
        console.log(err);
        console.log(server.vlan);
        should.not.exist(err);
        done();
      });
    });
    it('should be able to show error when try to save without server name', function (done) {
      this.timeout(10000);
      server.name='';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server name includes other than alphanumeric, space & dash - e.g: Server%', function (done) {
      this.timeout(10000);
      server.name='Server%';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server name includes other than alphanumeric, space & dash - e.g: Se*(-)', function (done) {
      this.timeout(10000);
      server.name='Se*(-)';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server name includes other than alphanumeric, space & dash - e.g: Ser+@1', function (done) {
      this.timeout(10000);
      server.name='Ser+@1';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to save when server name includes only alphanumeric, space & dash - e.g: Server Name-1', function (done) {
      this.timeout(10000);
      server.name='Server Name-1';
      server.save(function (err) {
        should.not.exist(err);
        server.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should not be able to save when server name is already present for the given tenant', function (done) {
      this.timeout(10000);
      server.name='Server Name-1';
      server.save(function (err) {
        should.not.exist(err);
        var server1 = new Server({
          name: server.name,
          site: site,
          pod: pod,
          subtenant: subtenant,
          managed: 'Customer',
          subnet: '10.23.12.0/26',
          subscription: subscription
        });
        server1.code = 'newserver';
        server1.save(function(err) {
          should.exist(err);
          server.remove(function (err) {
            should.not.exist(err);
            done();
          });
        });        
      });
    });

    it('should be able to show error when try to save without site', function (done) {
      this.timeout(10000);
      server.site='';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when try to save with invalid site', function (done) {
      this.timeout(10000);
      server.site= user._id;
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when try to save without subtenant', function (done) {
      this.timeout(10000);
      server.subtenant='';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

     it('should be able to show error when try to save with invalid subtenant', function (done) {
      this.timeout(10000);
      server.subtenant= user._id;
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when try to save without subnet', function (done) {
      this.timeout(10000);
      server.subnet='';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when try to save without subscription', function (done) {
      this.timeout(10000);
      server.subscription= '';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when try to save with invalid subscription', function (done) {
      this.timeout(10000);
      server.subscription= user._id;
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when try to save with invalid subscription ( subscription belongs to different tenant)', function (done) {
      this.timeout(10000);
      subscription.tenant = _tenant;
      subscription.save(function(err) {
        should.not.exist(err);
         server.save(function (err) {
          should.exist(err);
          done();
        });
      });   
    });

    it('should be able to show error when try to save with invalid subscription ( subscription belongs to different tenant -checked logged in user\'s tenant)', function (done) {
      this.timeout(10000);
      user.tenant = _tenant;
      user.save(function(err) {
        should.not.exist(err);
         server.save(function (err) {
          should.exist(err);
          done();
        });
      });   
    });

    it('should be able to show error when try to save with invalid subscription ( subscription belongs to different site)', function (done) {
      this.timeout(10000);
      subscription.site = _site;
      subscription.save(function(err) {
        should.not.exist(err);
         server.save(function (err) {
          should.exist(err);
          done();
        });
      });   
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 0.10.10.9', function (done) {
      this.timeout(10000);
      server.subnet='0.10.10.9';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 10.10.10.1144/26', function (done) {
      this.timeout(10000);
      server.subnet='10.10.10.1144/24';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 254.255.10.64/28', function (done) {
      this.timeout(10000);
      server.subnet='254.255.10.64/28';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 128-128-0-64/26', function (done) {
      this.timeout(10000);
      server.subnet='128-128-0-64/26';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 128-128-0-64/26', function (done) {
      this.timeout(10000);
      server.subnet='128-128-0-64/26';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 192.168.1.1/29', function (done) {
      this.timeout(10000);
      server.subnet='192.168.1.1/29';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 19216812131/26', function (done) {
      this.timeout(10000);
      server.subnet='19216812131/26';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server subnet is not in CIDR notation - e.g: 192.168.1.64', function (done) {
      this.timeout(10000);
      server.subnet='192.168.1.64';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server managed is other than Portal or Customer - e.g: Client', function (done) {
      this.timeout(10000);
      server.managed='Client';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server managed is other than Portal or Customer - e.g: Partner', function (done) {
      this.timeout(10000);
      server.managed='Partner';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server status is other than Creating, Updating, Operational, Deleting, Contact Support - e.g: Created', function (done) {
      this.timeout(10000);
      server.managed='Created';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server status is other than Creating, Updating, Operational, Deleting, Contact Support - e.g: Working', function (done) {
      this.timeout(10000);
      server.managed='Working';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when server status is other than Creating, Updating, Operational, Deleting, Contact Support - e.g: Error', function (done) {
      this.timeout(10000);
      server.managed='Error';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when cifsServerName includes other than alphanumeric & dash - e.g: cifs^$', function (done) {
      this.timeout(10000);
      server.cifsServername='cifs^$';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when cifsServerName includes other than alphanumeric & dash - e.g: cifs-~+', function (done) {
      this.timeout(10000);
      server.cifsServername='cifs-~+';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when cifsServerName includes other than alphanumeric & dash - e.g: cifs server1', function (done) {
      this.timeout(10000);
      server.cifsServername='cifs server1';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to save when cifsServerName includes only alphanumeric(lowecase) & dash - e.g: cifs-servername', function (done) {
      this.timeout(10000);
      server.cifsServername='cifs-servername';
      server.save(function (err) {
        should.not.exist(err);
        server.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show error when cifsDomain includes other than alphanumeric(lowecase), dot & dash - e.g: domain#`}`', function (done) {
      this.timeout(10000);
      server.cifsDomain='domain#`}';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when cifsDomain includes other than alphanumeric(lowecase), dot & dash - e.g: (*domain name)', function (done) {
      this.timeout(10000);
      server.cifsDomain='(*domain name)';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when cifsDomain includes other than alphanumeric(lowecase), dot & dash - e.g: cifs domain1', function (done) {
      this.timeout(10000);
      server.cifsDomain='cifs domain1';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to save when cifsDomain includes only alphanumeric(lowecase), dot & dash - e.g: Cifs.domain-name', function (done) {
      this.timeout(10000);
      server.cifsDomain='cifs.domain-name';
      server.save(function (err) {
        should.not.exist(err);
        server.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show error when iscsiAlias includes other than alphanumeric (lowercase) characters, dashes and dots - e.g: alias><;`', function (done) {
      this.timeout(10000);
      server.iscsiAlias='alias><;';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when iscsiAlias includes other than alphanumeric (lowercase) characters, dashes and dots - e.g: alias name', function (done) {
      this.timeout(10000);
      server.iscsiAlias='alias name';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when iscsiAlias includes other than alphanumeric (lowercase) characters, dashes and dots - e.g: alias_name|name', function (done) {
      this.timeout(10000);
      server.iscsiAlias='alias_name|name';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show error when iscsiAlias name less than 3 chars', function (done) {
      this.timeout(10000);
      server.iscsiAlias='al';
      server.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to save when iscsiAlias includes only alphanumeric (lowercase) characters, dashes and dots - e.g: iscsi-alias', function (done) {
      this.timeout(10000);
      server.iscsiAlias='iscsi-alias';
      server.save(function (err) {
        should.not.exist(err);
        server.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to save when iscsiAlias field leave blank', function (done) {
      this.timeout(10000);
      server.iscsiAlias= null;
      server.save(function (err) {
        should.not.exist(err);
        server.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);   
      server.save(function (err, serverres) {
        should.not.exist(err);  
        var obj = JSON.stringify(serverres);
        should.not.exist(obj.__v);
        should.not.exist(obj.created);
        should.not.exist(obj._id);
        should.not.exist(obj.user);
        done();
      });
    });


  });

  afterEach(function (done) { 
    User.remove().exec(function () {
      Tenant.remove().exec(function() {
        Subtenant.remove().exec(function() {
          Site.remove().exec(function() {
            Pod.remove().exec(function() {
              Subscription.remove().exec(function() {
                Server.remove().exec(function() {
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
