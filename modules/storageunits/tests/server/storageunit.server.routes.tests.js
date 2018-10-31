'use strict';

var nock = require('nock'),
  http = require('http'),
  should = require('should'),
  _ = require('lodash'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  Client = require('node-rest-client').Client,
  config = require(path.resolve('./config/config')),
  request = require('supertest'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  Site = mongoose.model('Site'),
  Pod = mongoose.model('Pod'),
  Subtenant = mongoose.model('Subtenant'),
  Server = mongoose.model('Server'),
  Subscription = mongoose.model('Subscription'),
  Storagegroup = mongoose.model('Storagegroup'),
  Storageunit = mongoose.model('Storageunit'),
  express = require(path.resolve('./config/lib/express'));

  /**
  * Globals
  */
var user, site, pod, app, agent, credentials, userRead, credentialsRead;
var partnerTenant, tenant1, tenant2, subtenant1, subtenant2, server1, server2, storagegroup1, storagegroup2, storageunit1,
storageunit2, storageunit, subscription1, subscription2;

/**
 * Server routes tests
 */
describe('Storageunit CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    credentialsRead = {
      username: 'username2',
      password: 'M3@n.jsI$Aw3$0m3'
    };

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

    userRead = new User({
      firstName: 'Test User',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      phone: '0823421453',
      username: credentialsRead.username,
      password: 'M3@n.jsI$Aw3$0m3',
      provider: 'local',
      roles: ['read']
    });

    pod = new Pod({
      name: 'Test Pod',
      code: 'tpd'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
    });

    tenant1 = new Tenant({
      name: 'Test Tenant',
      code: 'ttttt',
    });

    partnerTenant = new Tenant({
      code:'ptc',
      name:'partnerTenant'
    });

    tenant2 = new Tenant({
      code:'a1453',
      name:'testTenant2'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant1.annotation = 'test';
      tenant2.annotation = 'test';
      partnerTenant.annotation = 'test';
    }

    subtenant1 = new Subtenant({
      name: 'Test SubTenant',
      code: 'sssss',
    });

    subtenant2 = new Subtenant({
      name: 'Subtenant Name two',
      code: 'testsub2'
    });

    subscription1 = new Subscription({
      name: 'test subscription',
      code: 'testsub',
      url: 'http://test.com',
      description: 'this is the test subscription'
    });

    subscription2 = new Subscription({
      name: 'test subscription',
      code: 'testsubtwo',
      url: 'http://test.com',
      description: 'this is the second test subscription'
    });

    //initialize subscription pack when prepaid payment method setting is enabled
    if (featuresSettings.paymentMethod.prePaid) {
      subscription1.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
      subscription2.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
    }

    server1 = new Server({
      name: 'Test VFas',     
      managed: 'Portal',
      subnet: '10.23.12.0/26',
      code: 'testVfas',
      status:'Operational',
      nfs:true
    });

    server2 = new Server({
      name: 'Test Server two',
      subnet: '10.20.30.64/26',
      managed: 'Portal',
      status: 'Operational',
      nfs:true
    });

    storagegroup1 = new Storagegroup({
      name: 'Test Storage one',
      code: 'testcode1',
      tier: 'standard',
      snapshotPolicy: '7daily1810',
      status: 'Operational'
    });

    storagegroup2 = new Storagegroup({
      name: 'Test Storage two',
      code: 'testcode2',
      tier: 'standard',
      snapshotPolicy: '7daily1810',
      status: 'Operational'
    });

    storageunit1 = new Storageunit({
      name: 'test storage unit one',
      code: 'testsu1',
      protocol: 'nfs',
      sizegb:100,     
      status:'Operational'
    });

    storageunit2 = new Storageunit({
      name: 'test storage unit two',
      code: 'testsu2',
      protocol: 'nfs',
      sizegb:100,     
      status:'Operational'
    });

    partnerTenant.save(function(err) {
    should.not.exist(err);
    tenant1.partner = partnerTenant;
      tenant1.save(function (errTenant) {
        should.not.exist(errTenant);
        tenant2.save(function(err) {
          should.not.exist(err);
          user.tenant = mongoose.Types.ObjectId(tenant1._id);
          userRead.tenant = mongoose.Types.ObjectId(tenant1._id);
          user.save(function (errUser) {
            should.not.exist(errUser);
            userRead.save(function (errUser) {
              should.not.exist(errUser);
              subtenant1.tenant = mongoose.Types.ObjectId(tenant1._id);
              subtenant2.tenant = mongoose.Types.ObjectId(tenant2._id);
              subtenant1.save(function (errSubtenant) {
                should.not.exist(errSubtenant);
                subtenant2.save(function (errSubtenant) {
                  should.not.exist(errSubtenant);
                  site.save(function(errSite) {
                    should.not.exist(errSite);
                    pod.site = site;
                    pod.save(function(err){
                      should.not.exist(err);
                      subscription1.site = site;
                      subscription2.site = site;
                      subscription1.tenant = tenant1;
                      subscription1.partner = partnerTenant;
                      subscription2.tenant = tenant2;
                      subscription1.save(function(err) {
                        should.not.exist(err);
                        subscription2.save(function(err) {
                          should.not.exist(err);
                          server1.subtenant = mongoose.Types.ObjectId(subtenant1._id);
                          server2.subtenant = mongoose.Types.ObjectId(subtenant2._id);
                          server1.site = server2.site = mongoose.Types.ObjectId(site._id);
                          server1.subscription = mongoose.Types.ObjectId(subscription1._id);
                          server2.subscription = mongoose.Types.ObjectId(subscription2._id);
                          server1.save(function(errServer) {
                            should.not.exist(errServer);
                            server2.save(function(errServer) {
                              should.not.exist(errServer);  
                              storagegroup1.server = server1;
                              storagegroup2.server = server2;
                              storagegroup1.save(function(err) {
                                should.not.exist(err);
                                storagegroup2.save(function(err) {
                                  should.not.exist(err);
                                  storageunit1.storagegroup = storagegroup1;
                                  storageunit2.storagegroup = storagegroup2;  
                                  storageunit1.save(function(err) {
                                    should.not.exist(err);
                                    storageunit2.save(function(err) {
                                      should.not.exist(err);
                                      storageunit = {
                                        name: 'test storage unit',
                                        code: 'testsuss',
                                        protocol: 'nfs',
                                        sizegb:100,
                                        storagegroupId:mongoose.Types.ObjectId(storagegroup1._id),
                                        user:user,
                                        status:'Operational'
                                      };
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
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  ////////////////////////// list ///////////////////////////////////////////

  it('should be able to save an storageunit if logged in', function (done) {

    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65370"
            }
          }
        }
      );

    // mock get status request for storage unit create
    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65370')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits
            agent.get('/api/storageunits')
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Get storageunits list
                var storageunits = storageunitsGetRes.body;
                // Set assertions
                (storageunits[2].name).should.equal(storageunit.name);
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an storageunit if not logged in', function (done) {
    agent.post('/api/storageunits')
      .send(storageunit)
      .expect(401)
      .end(function (serverSaveErr, serverSaveRes) {
        // Call the assertion callback
        done(serverSaveErr);
      });
  });

  it('should not be able to save an storageunit if no protocol is provided', function (done) {
    storageunit.protocol = '';
    storageunit.lunOs = 'aix';
    storageunit.lunId = 1;


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(400)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Set message assertion
            (storageunitSaveRes.body.message.protocol).should.match('Storage Unit protocol required');

            // Handle storageunit save error
            done(storageunitSaveErr);
          });
      });
  });

  it('should be able to change the status of the storageunit to `Contact Support` if WFA failed to create the storageunit.', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
          }
        }
      );
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          //.expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            setTimeout(function() {
            //Get a list of storageunits
              agent.get('/api/storageunits')
                .end(function (storageunitsGetErr, storageunitsGetRes) {
                  if (storageunitsGetErr) {
                    return done(storageunitsGetErr);
                  }
                  // Get storageunits list
                  var storageunits = storageunitsGetRes.body;
                  // Set assertions
                  (storageunits[2].name).should.equal(storageunit.name);
                  (storageunits[2].status).should.equal("Contact Support");
                  // Call the assertion callback
                  done();
                });
              }, 3000);
          });
      });
  });

  it('should be able to change the status of the storageunit to `Contact Support` if WFA returrns the FAILED status.', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65371"
            }
          }
        }
      );

      var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65371')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["FAILED"], "phase":["EXECUTION"]}]
          }
        }
      );
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          //.expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits
            setTimeout(function() {
              agent.get('/api/storageunits')
                .end(function (storageunitsGetErr, storageunitsGetRes) {
                  if (storageunitsGetErr) {
                    return done(storageunitsGetErr);
                  }
                  // Get storageunits list
                  var storageunits = storageunitsGetRes.body;
                  // Set assertions
                  (storageunits[2].name).should.equal(storageunit.name);
                  (storageunits[2].status).should.equal("Contact Support");
                  // Call the assertion callback
                  done();
                });
              }, 4000);
          });
      });
  });

  it('should be able to change the status of the storageunit to `Contact Support` if WFA status request does not return jobId.', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65371"
            }
          }
        }
      );

      var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65371')
      .reply(200, {

        }
      );
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }

            setTimeout(function() {
            //Get a list of storageunits
              agent.get('/api/storageunits')
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Get storageunits list
                var storageunits = storageunitsGetRes.body;
                // Set assertions
                (storageunits[2].name).should.equal(storageunit.name);
                (storageunits[2].status).should.equal("Contact Support");
                // Call the assertion callback
                done();
              });
            }, 4000);
          });
      });
  });

  it('should be able to give call to untilcreated function if WFA status request returns `EXECUTION` status.', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65371"
            }
          }
        }
      );

      var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65371')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["EXECUTION"], "phase":["EXECUTION"]}]
          }
        }
      );
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits
            setTimeout(function() {
              agent.get('/api/storageunits')
                .end(function (storageunitsGetErr, storageunitsGetRes) {
                  if (storageunitsGetErr) {
                    return done(storageunitsGetErr);
                  }
                  // Get storageunits list
                  var storageunits = storageunitsGetRes.body;
                  // Set assertions
                  (storageunits[2].name).should.equal(storageunit.name);
                  (storageunits[2].status).should.equal("Creating");
                  // Call the assertion callback
                  done();
                });
              }, 10);
          });
      });
  });

  ////// //////////////    update       ///////////////////////////

  it('should be able to update the storageunit if valid data is passed and request is from fromFix page', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );
   
    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          //.expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits
            storageunit.status = "Operational";
            storageunit.fromFix = true;
            setTimeout(function() {
              agent.put('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                if (storageunitsUpdateErr) {
                  return done(storageunitsUpdateErr);
                }
                // Set assertions
                (storageunitsUpdateRes.body.name).should.equal(storageunit.name);
                (storageunitsUpdateRes.body.status).should.equal("Operational");
                // Call the assertion callback
                done();
              });
            }, 4000);
          });
      });
  });

  it('should not be able to update the storageunit if invalid data is passed and request is from fromFix page', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );
   
    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          //.expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //update storageunits
            storageunit.status = "Operationa";
            storageunit.fromFix = true;
            setTimeout(function() {
              agent.put('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
              .send(storageunit)
              .expect(400)
              .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                if (storageunitsUpdateErr) {
                  return done(storageunitsUpdateErr);
                }
                // Set assertions
                console.log(storageunitsUpdateRes);
                // Call the assertion callback
                done();
              });
            }, 4000);
          });
      });
  });

  it('should be able to update the storageunit if valid data is passed but status request returns `EXECUTION` status', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );
    //mock the response for successful update request
    var couchdbSuUpdate= nock('http://wfatestportal.com')
      .post('/suUpdate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65372"
            }
          }
        }
      );

    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    var couchdbSuReadStatusUpdate= nock('http://wfatestportal.com')
      .get('/suUpdate/jobs/65372')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["EXECUTION"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          //.expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits
            storageunit.sizegb = 105;
            setTimeout(function() {
              agent.put('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                if (storageunitsUpdateErr) {
                  return done(storageunitsUpdateErr);
                }
                // Set assertions
                (storageunitsUpdateRes.body.name).should.equal(storageunit.name);
                (storageunitsUpdateRes.body.status).should.equal("Updating");
                // Call the assertion callback
                done();
              });
            }, 4000);
          });
      });
  });

  it('should be able to update the storageunit if valid data is passed', function (done) {
    this.timeout(6000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );
    //mock the response for successful update request
    var couchdbSuUpdate= nock('http://wfatestportal.com')
      .post('/suUpdate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65372"
            }
          }
        }
      );

    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    var couchdbSuReadStatusUpdate= nock('http://wfatestportal.com')
      .get('/suUpdate/jobs/65372')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        storageunit.acl = '12.12.12.122';
        storageunit.protocol = 'nfs';
        storageunit.storagegroup = storagegroup1;
        // Save a new storageunit
        var storageunitObj = new Storageunit(storageunit) ;
        storageunitObj.save(function(err){
          should.not.exist(err);
          storageunit.sizegb = 105;
          storageunit.aclAdd = '12.12.14.122';
          storageunit.aclRemove= '12.12.14.122';
          agent.put('/api/storageunits/'+ storageunitObj._id)
            .send(storageunit)
            .expect(200)
            .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
              if (storageunitsUpdateErr) {
                return done(storageunitsUpdateErr);
              }
              // Set assertions
              (storageunitsUpdateRes.body.name).should.equal(storageunit.name);
              setTimeout(function() {
                agent.get('/api/storageunits')
                .end(function (storageunitsGetErr, storageunitsGetRes) {
                  if (storageunitsGetErr) {
                    return done(storageunitsGetErr);
                  }
                  // Get storageunits list
                  var storageunits = storageunitsGetRes.body;
                  // Set assertions
                  (storageunits[2].name).should.equal(storageunit.name);
                  (storageunits[2].status).should.equal("Operational");
                  // Call the assertion callback
                  storageunitObj.remove();
                  done();
                });
              }, 5000);
              // Call the assertion callback
            });
        });
      });
  });

  it('should not be able to update the storageunit if status of the storageunit is not operational', function (done) {

    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{

          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          //.expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }

            agent.put('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
              .send(storageunit)
              .expect(400)
              .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                if (storageunitsUpdateErr) {
                  return done(storageunitsUpdateErr);
                }
                // Set assertions
                (storageunitsUpdateRes.body.message).should.equal('Storage Unit is currently undergoing a different operation. Please wait until Status is Operational');
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to update the storageunit if invalid acl Add is passed', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );
    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        storageunit.acl = '111.121.112.111';
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits
            storageunit.sizegb = 105;
            storageunit.aclAdd = 'me,';
            storageunit.aclRemove= '111.121.112.111';

            setTimeout(function(){

              agent.put('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
              .send(storageunit)
              .expect(400)
              .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                if (storageunitsUpdateErr) {
                  return done(storageunitsUpdateErr);
                }
                // Set assertions
                (storageunitsUpdateRes.body.message).should.equal('Invalid ACL to add');
                // Call the assertion callback
                done();
              });
            }, 4000);
          });
      });
  });

  it('should not be able to update the storageunit if invalid acl remove is passed', function (done) {
    this.timeout(5000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );

    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        storageunit.acl = '11.11.111.111';
        storageunit.protocol='nfs';
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          //.expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }

            //Get a list of storageunits
            storageunit.sizegb = 105;
            storageunit.aclAdd = '11.11.111.114';
            storageunit.aclRemove= 'test1';
            setTimeout(function() {
              agent.put('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
                .send(storageunit)
                .expect(400)
                .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                  if (storageunitsUpdateErr) {
                    return done(storageunitsUpdateErr);
                  }
                  // Set assertions
                  (storageunitsUpdateRes.body.message).should.equal('ACL to be removed should be an exisitng ACL for the storageunit');
                  // Call the assertion callback
                  done();
                });
              }, 4000);
          });
      });
  });

  it('should not be able to update the storageunit if valid data is passed but WFA retunr failed as response', function (done) {
    this.timeout(5000);
    //mock the response for successful update request
    var couchdbSuUpdate= nock('http://wfatestportal.com')
      .post('/suUpdate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65375"
            }
          }
        }
      );

    var couchdbSuReadStatusUpdate= nock('http://wfatestportal.com')
      .get('/suUpdate/jobs/65375')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["FAILED"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
       var storageunitObj = new Storageunit(storageunit);
        storageunitObj.server = storageunit.serverId;
        storageunitObj.storagegroup = storageunit.storagegroupId;
        storageunitObj.user = user;
        storageunitObj.status = 'Operational';

        storageunitObj.save(function(err) {
          should.not.exist(err);
            //Get a list of storageunits
            storageunit.sizegb = 105;
            agent.put('/api/storageunits/'+ storageunitObj._id)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                if (storageunitsUpdateErr) {
                  return done(storageunitsUpdateErr);
                }
                setTimeout(function() {
                  agent.get('/api/storageunits/'+ storageunitObj._id)
                  .end(function (storageunitsGetErr, storageunitsGetRes) {
                    if (storageunitsGetErr) {
                      return done(storageunitsGetErr);
                    }
                    // Get storageunits list
                    var storageunits = storageunitsGetRes.body;
                    // Set assertions
                    (storageunits.name).should.equal(storageunit.name);
                    (storageunits.status).should.equal("Contact Support");
                    // Call the assertion callback
                    done();
                  });
                    // Call the assertion callback
                  }, 4000);
              });
          });
      });
  });

  it('should not be able to update the storageunit WFA does not return job id in update', function (done) {
    this.timeout(12000);
    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );
    //mock the response for successful update request
    var couchdbSuUpdate= nock('http://wfatestportal.com')
      .post('/suUpdate/jobs')
      .reply(200, {

        }
      );

    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }

            //Get a list of storageunits
            storageunit.sizegb = 105;

            setTimeout(function() {

              agent.put('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
                if (storageunitsUpdateErr) {
                  return done(storageunitsUpdateErr);
                }
                setTimeout(function() {
                  agent.get('/api/storageunits')
                    .end(function (storageunitsGetErr, storageunitsGetRes) {
                      if (storageunitsGetErr) {
                        return done(storageunitsGetErr);
                      }
                      // Get storageunits list
                      var storageunits = storageunitsGetRes.body;
                      // Set assertions
                      (storageunits[2].name).should.equal(storageunit.name);
                      (storageunits[2].status).should.equal("Contact Support");
                      // Call the assertion callback
                      done();
                    });
                  }, 3000);
                    // Call the assertion callback
              });
            }, 8000);
          });
      });
  });

  it('should not be able to update the storageunit if user is not authorized', function (done) {
    this.timeout(5000);
    agent.post('/api/auth/signin')
      .send(credentialsRead)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }        
        storageunit1.save(function(err) {
          should.not.exist(err);
          // Save a new storageunit
          agent.put('/api/storageunits/'+storageunit1._id)
            .expect(403)
            .end(function (storageunitsUpdateErr, storageunitsUpdateRes) {
              if (storageunitsUpdateErr) {
                return done(storageunitsUpdateErr);
              }      
              done();          
            });
        });
      });
  });

  ///////////////////////////////////////////deleted//////////////////////////////////
  it('should be able to delete the storageunit if valid', function (done) {
    this.timeout(5000);
    //mock the response for successful create request

    //mock the response for successful update request
    var couchdbSuDelete= nock('http://wfatestportal.com')
      .post('/suDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65372"
            }
          }
        }
      );


    var couchdbSuReadStatusDelete= nock('http://wfatestportal.com')
      .get('/suDelete/jobs/65372')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        var storageunitObj = new Storageunit(storageunit);
        storageunitObj.server = storageunit.serverId;
        storageunitObj.storagegroup = storageunit.storagegroupId;
        storageunitObj.user = user;
        storageunitObj.status = 'Operational';

        storageunitObj.save(function(err) {
          should.not.exist(err);

            agent.delete('/api/storageunits/'+ storageunitObj._id)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
                if (storageunitsDeleteErr) {
                  return done(storageunitsDeleteErr);
                }
                setTimeout(function(err) {
                  agent.get('/api/storageunits/'+ storageunitObj._id)
                  .expect(400)
                  .end(function (storageunitsGetErr, storageunitsGetRes) {
                    if (storageunitsGetErr) {
                      return done(storageunitsGetErr);
                    }
                    // Call the assertion callback
                    storageunitObj.remove();
                    done();
                  });
                }, 4000);
              });
          });
      });
  });

  it('should not  be able to delete the storageunit if storageunit\'s status is not operational', function (done) {

    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65374"
            }
          }
        }
      );
    //mock the response for successful update request
    var couchdbSuDelete= nock('http://wfatestportal.com')
      .post('/suDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65372"
            }
          }
        }
      );

    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65374')
      .reply(200, {

        }
      );

    var couchdbSuReadStatusDelete= nock('http://wfatestportal.com')
      .get('/suUpdate/jobs/65372')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }


            agent.delete('/api/storageunits/'+ storageunitSaveRes.body.storageunitId)
              .send(storageunit)
              .expect(400)
              .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
                if (storageunitsDeleteErr) {
                  return done(storageunitsDeleteErr);
                }
                 // Set assertions n
                (storageunitsDeleteRes.body.message).should.equal('Storage unit is currently undergoing a different operation. Please wait until Status = Operational');
                done();
              });
          });
      });
  });

  it('should  be able to delete the storageunit if storagegroup\'s status is not operational', function (done) {
    this.timeout(5000);

    //mock the response for successful update request
    var couchdbSuDelete= nock('http://wfatestportal.com')
      .post('/suDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65372"
            }
          }
        }
      );

    var couchdbSuReadStatusDelete= nock('http://wfatestportal.com')
      .get('/suUpdate/jobs/65372')
      .reply(200, {
          "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        var storageunitObj = new Storageunit(storageunit);
        storageunitObj.server = storageunit.serverId;
        storageunitObj.storagegroup = storageunit.storagegroupId;
        storageunitObj.user = user;
        storageunitObj.status = 'Operational';

        storageunitObj.save(function(err) {
          should.not.exist(err);
           //change the status of the storagegroup to contact supp[rt]
            storagegroup1.status = 'Contact Support';
            storagegroup1.save(function(err) {
              should.not.exist(err);

              agent.delete('/api/storageunits/'+ storageunitObj._id)
                .send(storageunit)
                .expect(200)
                .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
                  if (storageunitsDeleteErr) {
                    return done(storageunitsDeleteErr);
                  }

                  done();
                });
            });
        });
      });
  });

  it('should not be able to delete the storageunit if WFA does not return job id', function (done) {
    this.timeout(5000);
    //mock the response for successful update request
    var couchdbSuDelete= nock('http://wfatestportal.com')
      .post('/suDelete/jobs')
      .reply(200, {

        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        var storageunitObj = new Storageunit(storageunit);
        storageunitObj.server = storageunit.serverId;
        storageunitObj.storagegroup = storageunit.storagegroupId;
        storageunitObj.user = user;
        storageunitObj.status = 'Operational';

        storageunitObj.save(function(err) {
          should.not.exist(err);

            agent.delete('/api/storageunits/'+  storageunitObj._id)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
                if (storageunitsDeleteErr) {
                  return done(storageunitsDeleteErr);
                }
                setTimeout(function() {
                  agent.get('/api/storageunits/'+  storageunitObj._id)
                  .expect(200)
                  .end(function (storageunitsGetErr, storageunitsGetRes) {
                    if (storageunitsGetErr) {
                      return done(storageunitsGetErr);
                    }
                    storageunit = storageunitsGetRes.body;
                    (storageunit.name).should.equal(storageunit.name);
                    (storageunit.status).should.equal("Contact Support");
                    storageunitObj.remove();
                    done();
                  });
                }, 4000);
              });
          });
      });
  });

  it('should not be able to delete the storageunit if WFA does not return job id in delete status request', function (done) {

   this.timeout(5000);
    //mock the response for successful update request
    var couchdbSuDelete= nock('http://wfatestportal.com')
      .post('/suDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65375"
            }
          }
        }
      );

    var couchdbSuDeleteStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65375')
      .reply(200, {
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        var storageunitObj = new Storageunit(storageunit);
        storageunitObj.server = storageunit.serverId;
        storageunitObj.storagegroup = storageunit.storagegroupId;
        storageunitObj.user = user;
        storageunitObj.status = 'Operational';

        storageunitObj.save(function(err) {
          should.not.exist(err);

            agent.delete('/api/storageunits/'+ storageunitObj._id)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
                if (storageunitsDeleteErr) {
                  return done(storageunitsDeleteErr);
                }
                setTimeout(function(err){
                  agent.get('/api/storageunits/'+ storageunitObj._id)
                  .expect(200)
                  .end(function (storageunitsGetErr, storageunitsGetRes) {
                    if (storageunitsGetErr) {
                      return done(storageunitsGetErr);
                    }
                    storageunit = storageunitsGetRes.body;
                    (storageunit.name).should.equal(storageunit.name);
                    (storageunit.status).should.equal("Contact Support");
                    storageunitObj.remove();
                    done();
                  });
                }, 4000);
              });
          });
      });
  });

  it('should not be able to delete the storageunit if WFA does return `FAILED` in delete status request', function (done) {
    this.timeout(5000);

    //mock the response for successful update request
    var couchdbSuDelete= nock('http://wfatestportal.com')
      .post('/suDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65375"
            }
          }
        }
      );

    var couchdbSuDeleteStatus= nock('http://wfatestportal.com')
      .get('/suDelete/jobs/65375')
      .reply(200, {
      "job":{
            "jobStatus":[{"jobStatus":["FAILED"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        var storageunitObj = new Storageunit(storageunit);
        storageunitObj.server = storageunit.serverId;
        storageunitObj.storagegroup = storageunit.storagegroupId;
        storageunitObj.user = user;
        storageunitObj.status = 'Operational';

        storageunitObj.save(function(err) {
          should.not.exist(err);

            agent.delete('/api/storageunits/'+ storageunitObj._id)
              .send(storageunit)
              .expect(200)
              .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
                if (storageunitsDeleteErr) {
                  return done(storageunitsDeleteErr);
                }
                setTimeout(function() {
                  agent.get('/api/storageunits/'+ storageunitObj._id)
                    .expect(200)
                    .end(function (storageunitsGetErr, storageunitsGetRes) {
                      if (storageunitsGetErr) {
                        return done(storageunitsGetErr);
                      }
                      storageunit = storageunitsGetRes.body;
                      (storageunit.name).should.equal(storageunit.name);
                      (storageunit.status).should.equal("Contact Support");
                      storageunitObj.remove();
                      done();
                    });
                  }, 4000);
              });
          });
      });
  });

  it('should not be able to delete the storageunit if WFA does return `EXECUTION` in delete status request', function (done) {
    this.timeout(5000);

    //mock the response for successful update request
    var couchdbSuDelete= nock('http://wfatestportal.com')
      .post('/suDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65375"
            }
          }
        }
      );

    var couchdbSuDeleteStatus= nock('http://wfatestportal.com')
      .get('/suDelete/jobs/65375')
      .reply(200, {
      "job":{
            "jobStatus":[{"jobStatus":["EXECUTION"], "phase":["EXECUTION"]}]
          }
        }
      );


    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
       var storageunitObj = new Storageunit(storageunit);
        storageunitObj.server = storageunit.serverId;
        storageunitObj.storagegroup = storageunit.storagegroupId;
        storageunitObj.user = user;
        storageunitObj.status = 'Operational';

        storageunitObj.save(function(err) {
          should.not.exist(err);
            agent.delete('/api/storageunits/'+ storageunitObj._id)
            .send(storageunit)
            .expect(200)
            .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
              if (storageunitsDeleteErr) {
                return done(storageunitsDeleteErr);
              }
            setTimeout(function() {
                agent.get('/api/storageunits/'+ storageunitObj._id)
                  .expect(200)
                  .end(function (storageunitsGetErr, storageunitsGetRes) {
                    if (storageunitsGetErr) {
                      return done(storageunitsGetErr);
                    }
                    storageunit = storageunitsGetRes.body;
                    (storageunit.name).should.equal(storageunit.name);
                    (storageunit.status).should.equal("Deleting");
                    storageunitObj.remove();
                    done();
                  });
              });
            }, 4000);
          });
      });
  });

  ////////  list ////////////////////////////////////////
  it('should be able to list storageunit on basis of valid server provided in query parameter if logged in', function (done) {

    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65370"
            }
          }
        }
      );

    // mock get status request for storage unit create
    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65370')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits on basis of server
            agent.get('/api/storageunits?server='+server1._id)
              .expect(200)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Get storageunits list
                var storageunits = storageunitsGetRes.body;
                // Set assertions
                (storageunits[1].name).should.equal(storageunit.name);
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to show an error in list storageunit if invalid server provided in query parameter if logged in', function (done) {

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
       
        //Get a list of storageunits on basis of invalid server
        agent.get('/api/storageunits?server=test')
          .expect(400)
          .end(function (storageunitsGetErr, storageunitsGetRes) {
            // Handle storageunit save error
            if (storageunitsGetErr) {
              return done(storageunitsGetErr);
            }           
            (storageunitsGetRes.body.message).should.equal('Invalid server Id');
            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to list storageunit on basis of valid storagegroup provided in query parameter if logged in', function (done) {

    //mock the response for successful create request
    var couchdbSuCreate= nock('http://wfatestportal.com')
      .post('/suCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65370"
            }
          }
        }
      );

    // mock get status request for storage unit create
    var couchdbSuReadStatus= nock('http://wfatestportal.com')
      .get('/suCreate/jobs/65370')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new storageunit
        agent.post('/api/storageunits')
          .send(storageunit)
          .expect(200)
          .end(function (storageunitSaveErr, storageunitSaveRes) {
            // Handle storageunit save error
            if (storageunitSaveErr) {
              return done(storageunitSaveErr);
            }
            //Get a list of storageunits on basis of server
            agent.get('/api/storageunits?storagegroup='+storagegroup1._id)
              .expect(200)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Get storageunits list
                var storageunits = storageunitsGetRes.body;
                // Set assertions
                (storageunits[1].name).should.equal(storageunit.name);
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to show an error in list storageunit if invalid storagegroup provided in query parameter if logged in', function (done) {

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
       
        //Get a list of storageunits on basis of invalid server
        agent.get('/api/storageunits?storagegroup=test')
          .end(function (storageunitsGetErr, storageunitsGetRes) {
            // Handle storageunit save error
            if (storageunitsGetErr) {
              return done(storageunitsGetErr);
            }
           (storageunitsGetRes.body.message).should.equal('Invalid storagegroup Id');
            // Call the assertion callback
            done();
          });
      });
  });

  it('should not be able to get an storageunit if signed in and authorized with read user of other tenant', function (done) {
    // login with the read user
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      storageunit2.save(function(err){
        should.not.exist(err);
        agent.get('/api/storageunits/' + storageunit2._id)
        .expect(403)
        .end(function (storageunitErr, storageunitRes) {          
          done();
        });
      })  ;    
    });
  });

  //////////////feature basesd settings test cases ////////////////////////////////////

  if(_.includes(featuresSettings.roles.storageunit.read, 'partner')){
    it('should be able to get the storageunit under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get a list of storageunits
            agent.get('/api/storageunits/'+storageunit1._id)
              .expect(200)
              .end(function (storageunitGetErr, storageunitGetRes) {
                // Handle storageunit save error
                if (storageunitGetErr) {
                  return done(storageunitGetErr);
                }
                // Get storageunits list
                var storageunit = storageunitGetRes.body;

                // Set assertions
                (storageunit.name).should.equal(storageunit1.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to get the storageunit which is not under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get a list of storageunits
            agent.get('/api/storageunits/'+storageunit2._id)
              .expect(403)
              .end(function (storageunitsGetErr, storageunitsGetRes) {                
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.storageunit.list, 'partner')){
    it('should be able to list the storageunits under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get a list of storageunits
            agent.get('/api/storageunits')
              .expect(200)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Get storageunits list
                var storageunits = storageunitsGetRes.body;

                // Set assertions
                (storageunits[0].name).should.equal(storageunit1.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to list the storageunits which are not under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get a list of storageunits
            agent.get('/api/storageunits')
              .expect(200)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Get storageunits list
                var storageunits = storageunitsGetRes.body;

                // Set assertions
                (storageunits[0].name).should.not.be.equal(storageunit2.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.storageunit.update,'partner')){
    it('should be able to update a storageunit under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            storageunit1.name = "testing1";
            // Get a list of storageunits
            agent.put('/api/storageunits/'+storageunit1._id)
              .send(storageunit1)
              //.expect(200)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Get storageunits list
                var storageunits = storageunitsGetRes.body;

                // Set assertions
                (storageunits.name).should.match('testing1');

                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to update a storageunit not under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            storageunit2.name = "testing1";
            // Get a list of storageunits
            agent.put('/api/storageunits/'+storageunit2._id)
              .send(storageunit2)
              .expect(403)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.storageunit.delete,'partner')){
    it('should be able to delete a Storagegroup under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get a list of storageunits
            agent.delete('/api/storageunits/'+storageunit1._id)
              .expect(200)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to delete a storageunit not under his partnership if signed in with partner', function (done) {
      user.roles = ['partner'];
      user.tenant = partnerTenant;
      user.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentials)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get a list of storageunits
            agent.put('/api/storageunits/'+storageunit2._id)
              .expect(403)
              .end(function (storageunitsGetErr, storageunitsGetRes) {
                // Handle storageunit save error
                if (storageunitsGetErr) {
                  return done(storageunitsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  afterEach(function (done) {
    User.remove().exec(function() {     
      Tenant.remove().exec(function() {
        Subtenant.remove().exec(function() {
          Server.remove().exec(function () {
            Pod.remove().exec(function() {
              Site.remove().exec(function() {
                Subscription.remove().exec(function() {
                  Storagegroup.remove().exec(function() {
                    nock.cleanAll();
                    partnerTenant.remove();
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
