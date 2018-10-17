'use strict';

var nock = require('nock'),
  http = require('http'),
  should = require('should'),
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
  express = require(path.resolve('./config/lib/express'));

  /**
  * Globals
  */
var user, site, pod, tenant, subtenant, server, storagegroup, app, agent, credentials, _tenant, subscription;

/**
 * Server routes tests
 */
describe('Snapshot CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    credentials = {
      username: 'username',
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
      roles: ['admin']
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

    //mocks
    var serverKey = 'cdf70952-7c8f-11e5-b511-00a0981b42ca:type=vserver,uuid=19508c8b-2600-11e6-8be5-00a0981b42ca';
    var serverName = 'dfaas_agl_agls002_001';
    var storageGroupName = 'code111';

    //mock the response for successful create request on snapshot
    var couchdbSsList= nock('https://apiservicetestportal.com/api/1.0/ontap/')
      .get('snapshots')
      .reply(200, {
        "status":{"code":"SUCCESS"},
        "result":{
          "total_records":1,
          "records":[{'key' : 'testServerKey'}]
        }
      });


    //mock the response for successful create request on snapshot
    var couchdbSsCreate= nock('https://apiservicetestportal.com/api/1.0/ontap/')
      .post('snapshots')
      .reply(200, {});

    // mock get server details for snapshots
    var couchdbSsServerDetails= nock('https://apiservicetestportal.com/api/1.0/ontap/')
      .get('storage-vms?name=dfaas_agl_agls002_001')
      .reply(200, {
          "status":{"code":"SUCCESS"},
          "result":{
            "total_records":1,
            "records":[{'key' : 'testServerKey'}]
          }
        }
      );

    // mock get volume details for snapshots
    var couchdbSsVolumeDetails= nock('https://apiservicetestportal.com/api/1.0/ontap/')
      .get('volumes?storage_vm_key=' + serverKey + '&name=' + storageGroupName)
      .reply(200, {
          "status":{"code":"SUCCESS"},
          "result":{
            "total_records":1,
            "records":[{'key' : 'testVolumeKey'}]
          }
        }
      );

    tenant.save(function(err){
      user.tenant = tenant._id;
      user.save(function () {
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
                  code: 'dfaas_agl_agls002_001',
                  status:'Operational',
                  nfs:true,
                  subscription:subscription
                });
                server.save(function(err) {
                  should.not.exist(err);
                  storagegroup = new Storagegroup({
                    name: 'Test Storage group',
                    code: 'testsg',
                    server:server,
                    tier:'ultra',
                    snapshotPolicy:'7daily1810',
                    status:'Operational',
                    user: user
                  });
                  storagegroup.save(function(err) {
                    should.not.exist(err);
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

  // it('should be able to create an snapshot if logged in', function (done) {

  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Create new snapshot
  //       agent.post('/api/storagegroups/' + storagegroup._id + '/snapshots')
  //         .expect(200)
  //         .end(function (snapshotSaveErr, snapshotSaveRes) {
  //           // Handle storageunit save error
  //           if (snapshotSaveErr) {
  //             return done(snapshotSaveErr);
  //           }
  //           //Get a list of storageunits
  //           agent.get('/api/storagegroups/' + storagegroup._id + '/snapshots')
  //             //.expect(200)
  //             .end(function (snapshotGetErr, snapshotGetRes) {
  //               console.log(snapshotGetRes);
  //               // Handle storageunit save error
  //               if (snapshotGetErr) {
  //                 return done(snapshotGetErr);
  //               }
  //               // Get storageunits list
  //               var snapshots = snapshotGetRes.body;
  //               // Set assertions
  //               (snapshots.status).should.equal('SUCCESS');
  //               // Call the assertion callback
  //               done();
  //             });
  //         });
  //     });
  // });

  // it('should not be able to save an storageunit if not logged in', function (done) {
  //   agent.post('/api/servers')
  //     .send(storageunit)
  //     .expect(401)
  //     .end(function (serverSaveErr, serverSaveRes) {
  //       // Call the assertion callback
  //       done(serverSaveErr);
  //     });
  // });

  // it('should not be able to save an storageunit if no protocol is provided', function (done) {
  //   storageunit.protocol = '';
  //   storageunit.lunOs = 'aix';
  //   storageunit.lunId = 1;


  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       if (signinErr) {
  //         return done(signinErr);
  //       }

  //       // Save a new storageunit
  //       agent.post('/api/storageunits')
  //         .send(storageunit)
  //         .expect(400)
  //         .end(function (snapshotSaveErr, snapshotSaveRes) {
  //           // Set message assertion
  //           (snapshotSaveRes.body.message.protocol).should.match('Storage Unit protocol required');

  //           // Handle storageunit save error
  //           done(snapshotSaveErr);
  //         });
  //     });
  // });

  // it('should be able to change the status of the storageunit to `Contact Support` if WFA failed to create the storageunit.', function (done) {

  //   //mock the response for successful create request
  //   var couchdbSuCreate= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suCreate/jobs')
  //     .reply(200, {
  //         "job":{
  //         }
  //       }
  //     );
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Save a new storageunit
  //       agent.post('/api/storageunits')
  //         .send(storageunit)
  //         //.expect(200)
  //         .end(function (snapshotSaveErr, snapshotSaveRes) {
  //           // Handle storageunit save error
  //           if (snapshotSaveErr) {
  //             return done(snapshotSaveErr);
  //           }
  //           //Get a list of storageunits
  //           agent.get('/api/storageunits')
  //             .end(function (snapshotGetErr, snapshotGetRes) {
  //               if (snapshotGetErr) {
  //                 return done(snapshotGetErr);
  //               }
  //               // Get storageunits list
  //               var storageunits = snapshotGetRes.body;
  //               // Set assertions
  //               (storageunits[0].name).should.equal(storageunit.name);
  //               (storageunits[0].status).should.equal("Contact Support");
  //               // Call the assertion callback
  //               done();
  //             });
  //         });
  //     });
  // });

  // it('should be able to change the status of the storageunit to `Contact Support` if WFA returrns the FAILED status.', function (done) {
  //   this.timeout(5000);
  //   //mock the response for successful create request
  //   var couchdbSuCreate= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suCreate/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65371"
  //           }
  //         }
  //       }
  //     );

  //     var couchdbSuReadStatus= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suCreate/jobs/65371')
  //     .reply(200, {
  //       "job":{
  //           "jobStatus":[{"jobStatus":["FAILED"], "phase":["EXECUTION"]}]
  //         }
  //       }
  //     );
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Save a new storageunit
  //       agent.post('/api/storageunits')
  //         .send(storageunit)
  //         //.expect(200)
  //         .end(function (snapshotSaveErr, snapshotSaveRes) {
  //           // Handle storageunit save error
  //           if (snapshotSaveErr) {
  //             return done(snapshotSaveErr);
  //           }
  //           //Get a list of storageunits
  //           setTimeout(function() {
  //             agent.get('/api/storageunits')
  //               .end(function (snapshotGetErr, snapshotGetRes) {
  //                 if (snapshotGetErr) {
  //                   return done(snapshotGetErr);
  //                 }
  //                 // Get storageunits list
  //                 var storageunits = snapshotGetRes.body;
  //                 // Set assertions
  //                 (storageunits[0].name).should.equal(storageunit.name);
  //                 (storageunits[0].status).should.equal("Contact Support");
  //                 // Call the assertion callback
  //                 done();
  //               });
  //             }, 4000);
  //         });
  //     });
  // });

  // it('should be able to change the status of the storageunit to `Contact Support` if WFA status request does not return jobId.', function (done) {
  //   this.timeout(5000);
  //   //mock the response for successful create request
  //   var couchdbSuCreate= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suCreate/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65371"
  //           }
  //         }
  //       }
  //     );

  //     var couchdbSuReadStatus= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suCreate/jobs/65371')
  //     .reply(200, {

  //       }
  //     );
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Save a new storageunit
  //       agent.post('/api/storageunits')
  //         .send(storageunit)
  //         .expect(200)
  //         .end(function (snapshotSaveErr, snapshotSaveRes) {
  //           // Handle storageunit save error
  //           if (snapshotSaveErr) {
  //             return done(snapshotSaveErr);
  //           }

  //           setTimeout(function() {
  //           //Get a list of storageunits
  //             agent.get('/api/storageunits')
  //             .end(function (snapshotGetErr, snapshotGetRes) {
  //               if (snapshotGetErr) {
  //                 return done(snapshotGetErr);
  //               }
  //               // Get storageunits list
  //               var storageunits = snapshotGetRes.body;
  //               // Set assertions
  //               (storageunits[0].name).should.equal(storageunit.name);
  //               (storageunits[0].status).should.equal("Contact Support");
  //               // Call the assertion callback
  //               done();
  //             });
  //           }, 4000);
  //         });
  //     });
  // });

  // it('should be able to give call to untilcreated function if WFA status request returns `EXECUTION` status.', function (done) {
  //   this.timeout(5000);
  //   //mock the response for successful create request
  //   var couchdbSuCreate= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suCreate/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65371"
  //           }
  //         }
  //       }
  //     );

  //     var couchdbSuReadStatus= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suCreate/jobs/65371')
  //     .reply(200, {
  //         "job":{
  //           "jobStatus":[{"jobStatus":["EXECUTION"], "phase":["EXECUTION"]}]
  //         }
  //       }
  //     );
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Save a new storageunit
  //       agent.post('/api/storageunits')
  //         .send(storageunit)
  //         .expect(200)
  //         .end(function (snapshotSaveErr, snapshotSaveRes) {
  //           // Handle storageunit save error
  //           if (snapshotSaveErr) {
  //             return done(snapshotSaveErr);
  //           }
  //           //Get a list of storageunits
  //           setTimeout(function() {
  //             agent.get('/api/storageunits')
  //               .end(function (snapshotGetErr, snapshotGetRes) {
  //                 if (snapshotGetErr) {
  //                   return done(snapshotGetErr);
  //                 }
  //                 // Get storageunits list
  //                 var storageunits = snapshotGetRes.body;
  //                 // Set assertions
  //                 (storageunits[0].name).should.equal(storageunit.name);
  //                 (storageunits[0].status).should.equal("Creating");
  //                 // Call the assertion callback
  //                 done();
  //               });
  //             }, 4000);
  //         });
  //     });
  // });

  // ///////////////////////////////////////////deleted//////////////////////////////////
  // it('should be able to delete the storageunit if valid', function (done) {
  //   this.timeout(5000);
  //   //mock the response for successful create request

  //   //mock the response for successful update request
  //   var couchdbSuDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suDelete/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65372"
  //           }
  //         }
  //       }
  //     );


  //   var couchdbSuReadStatusDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suDelete/jobs/65372')
  //     .reply(200, {
  //         "job":{
  //           "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
  //         }
  //       }
  //     );


  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Save a new storageunit
  //       var storageunitObj = new Storageunit(storageunit);
  //       storageunitObj.server = storageunit.serverId;
  //       storageunitObj.storagegroup = storageunit.storagegroupId;
  //       storageunitObj.user = user;
  //       storageunitObj.status = 'Operational';

  //       storageunitObj.save(function(err) {
  //         should.not.exist(err);

  //           agent.delete('/api/storageunits/'+ storageunitObj._id)
  //             .send(storageunit)
  //             .expect(200)
  //             .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
  //               if (storageunitsDeleteErr) {
  //                 return done(storageunitsDeleteErr);
  //               }
  //               setTimeout(function(err) {
  //                 agent.get('/api/storageunits/'+ storageunitObj._id)
  //                 .expect(400)
  //                 .end(function (snapshotGetErr, snapshotGetRes) {
  //                   if (snapshotGetErr) {
  //                     return done(snapshotGetErr);
  //                   }
  //                   // Call the assertion callback
  //                   storageunitObj.remove();
  //                   done();
  //                 });
  //               }, 4000);
  //             });
  //         });
  //     });
  // });

  // it('should not  be able to delete the storageunit if storageunit\'s status is not operational', function (done) {

  //   //mock the response for successful create request
  //   var couchdbSuCreate= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suCreate/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65374"
  //           }
  //         }
  //       }
  //     );
  //   //mock the response for successful update request
  //   var couchdbSuDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suDelete/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65372"
  //           }
  //         }
  //       }
  //     );

  //   var couchdbSuReadStatus= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suCreate/jobs/65374')
  //     .reply(200, {

  //       }
  //     );

  //   var couchdbSuReadStatusDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suUpdate/jobs/65372')
  //     .reply(200, {
  //         "job":{
  //           "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
  //         }
  //       }
  //     );


  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Save a new storageunit
  //       agent.post('/api/storageunits')
  //         .send(storageunit)
  //         .expect(200)
  //         .end(function (snapshotSaveErr, snapshotSaveRes) {
  //           // Handle storageunit save error
  //           if (snapshotSaveErr) {
  //             return done(snapshotSaveErr);
  //           }


  //           agent.delete('/api/storageunits/'+ snapshotSaveRes.body.storageunitId)
  //             .send(storageunit)
  //             .expect(400)
  //             .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
  //               if (storageunitsDeleteErr) {
  //                 return done(storageunitsDeleteErr);
  //               }
  //                // Set assertions n
  //               (storageunitsDeleteRes.body.message).should.equal('Storage unit is currently undergoing a different operation. Please wait until Status = Operational');
  //               done();
  //             });
  //         });
  //     });
  // });

  // it('should  be able to delete the storageunit if storagegroup\'s status is not operational', function (done) {
  //   this.timeout(5000);

  //   //mock the response for successful update request
  //   var couchdbSuDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suDelete/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65372"
  //           }
  //         }
  //       }
  //     );

  //   var couchdbSuReadStatusDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suUpdate/jobs/65372')
  //     .reply(200, {
  //         "job":{
  //           "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
  //         }
  //       }
  //     );


  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       var storageunitObj = new Storageunit(storageunit);
  //       storageunitObj.server = storageunit.serverId;
  //       storageunitObj.storagegroup = storageunit.storagegroupId;
  //       storageunitObj.user = user;
  //       storageunitObj.status = 'Operational';

  //       storageunitObj.save(function(err) {
  //         should.not.exist(err);
  //          //change the status of the storagegroup to contact supp[rt]
  //           storagegroup.status = 'Contact Support';
  //           storagegroup.save(function(err) {
  //             should.not.exist(err);

  //             agent.delete('/api/storageunits/'+ storageunitObj._id)
  //               .send(storageunit)
  //               .expect(200)
  //               .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
  //                 if (storageunitsDeleteErr) {
  //                   return done(storageunitsDeleteErr);
  //                 }

  //                 done();
  //               });
  //           });
  //       });
  //     });
  // });

  // it('should not be able to delete the storageunit if WFA does not return job id', function (done) {
  //   this.timeout(5000);
  //   //mock the response for successful update request
  //   var couchdbSuDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suDelete/jobs')
  //     .reply(200, {

  //       }
  //     );

  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       var storageunitObj = new Storageunit(storageunit);
  //       storageunitObj.server = storageunit.serverId;
  //       storageunitObj.storagegroup = storageunit.storagegroupId;
  //       storageunitObj.user = user;
  //       storageunitObj.status = 'Operational';

  //       storageunitObj.save(function(err) {
  //         should.not.exist(err);

  //           agent.delete('/api/storageunits/'+  storageunitObj._id)
  //             .send(storageunit)
  //             .expect(200)
  //             .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
  //               if (storageunitsDeleteErr) {
  //                 return done(storageunitsDeleteErr);
  //               }
  //               setTimeout(function() {
  //                 agent.get('/api/storageunits/'+  storageunitObj._id)
  //                 .expect(200)
  //                 .end(function (snapshotGetErr, snapshotGetRes) {
  //                   if (snapshotGetErr) {
  //                     return done(snapshotGetErr);
  //                   }
  //                   storageunit = snapshotGetRes.body;
  //                   (storageunit.name).should.equal(storageunit.name);
  //                   (storageunit.status).should.equal("Contact Support");
  //                   storageunitObj.remove();
  //                   done();
  //                 });
  //               }, 4000);
  //             });
  //         });
  //     });
  // });

  // it('should not be able to delete the storageunit if WFA does not return job id in delete status request', function (done) {

  //  this.timeout(5000);
  //   //mock the response for successful update request
  //   var couchdbSuDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suDelete/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65375"
  //           }
  //         }
  //       }
  //     );

  //   var couchdbSuDeleteStatus= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suCreate/jobs/65375')
  //     .reply(200, {
  //       }
  //     );


  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       var storageunitObj = new Storageunit(storageunit);
  //       storageunitObj.server = storageunit.serverId;
  //       storageunitObj.storagegroup = storageunit.storagegroupId;
  //       storageunitObj.user = user;
  //       storageunitObj.status = 'Operational';

  //       storageunitObj.save(function(err) {
  //         should.not.exist(err);

  //           agent.delete('/api/storageunits/'+ storageunitObj._id)
  //             .send(storageunit)
  //             .expect(200)
  //             .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
  //               if (storageunitsDeleteErr) {
  //                 return done(storageunitsDeleteErr);
  //               }
  //               setTimeout(function(err){
  //                 agent.get('/api/storageunits/'+ storageunitObj._id)
  //                 .expect(200)
  //                 .end(function (snapshotGetErr, snapshotGetRes) {
  //                   if (snapshotGetErr) {
  //                     return done(snapshotGetErr);
  //                   }
  //                   storageunit = snapshotGetRes.body;
  //                   (storageunit.name).should.equal(storageunit.name);
  //                   (storageunit.status).should.equal("Contact Support");
  //                   storageunitObj.remove();
  //                   done();
  //                 });
  //               }, 4000);
  //             });
  //         });
  //     });
  // });

  // it('should not be able to delete the storageunit if WFA does return `FAILED` in delete status request', function (done) {
  //   this.timeout(5000);

  //   //mock the response for successful update request
  //   var couchdbSuDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suDelete/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65375"
  //           }
  //         }
  //       }
  //     );

  //   var couchdbSuDeleteStatus= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suDelete/jobs/65375')
  //     .reply(200, {
  //     "job":{
  //           "jobStatus":[{"jobStatus":["FAILED"], "phase":["EXECUTION"]}]
  //         }
  //       }
  //     );


  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //       // Save a new storageunit
  //       var storageunitObj = new Storageunit(storageunit);
  //       storageunitObj.server = storageunit.serverId;
  //       storageunitObj.storagegroup = storageunit.storagegroupId;
  //       storageunitObj.user = user;
  //       storageunitObj.status = 'Operational';

  //       storageunitObj.save(function(err) {
  //         should.not.exist(err);

  //           agent.delete('/api/storageunits/'+ storageunitObj._id)
  //             .send(storageunit)
  //             .expect(200)
  //             .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
  //               if (storageunitsDeleteErr) {
  //                 return done(storageunitsDeleteErr);
  //               }
  //               setTimeout(function() {
  //                 agent.get('/api/storageunits/'+ storageunitObj._id)
  //                   .expect(200)
  //                   .end(function (snapshotGetErr, snapshotGetRes) {
  //                     if (snapshotGetErr) {
  //                       return done(snapshotGetErr);
  //                     }
  //                     storageunit = snapshotGetRes.body;
  //                     (storageunit.name).should.equal(storageunit.name);
  //                     (storageunit.status).should.equal("Contact Support");
  //                     storageunitObj.remove();
  //                     done();
  //                   });
  //                 }, 4000);
  //             });
  //         });
  //     });
  // });

  // it('should not be able to delete the storageunit if WFA does return `EXECUTION` in delete status request', function (done) {
  //   this.timeout(5000);

  //   //mock the response for successful update request
  //   var couchdbSuDelete= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .post('/suDelete/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65375"
  //           }
  //         }
  //       }
  //     );

  //   var couchdbSuDeleteStatus= nock('https://apiservicetestportal.com/api/1.0/ontap/')
  //     .get('/suDelete/jobs/65375')
  //     .reply(200, {
  //     "job":{
  //           "jobStatus":[{"jobStatus":["EXECUTION"], "phase":["EXECUTION"]}]
  //         }
  //       }
  //     );


  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //      var storageunitObj = new Storageunit(storageunit);
  //       storageunitObj.server = storageunit.serverId;
  //       storageunitObj.storagegroup = storageunit.storagegroupId;
  //       storageunitObj.user = user;
  //       storageunitObj.status = 'Operational';

  //       storageunitObj.save(function(err) {
  //         should.not.exist(err);
  //           agent.delete('/api/storageunits/'+ storageunitObj._id)
  //           .send(storageunit)
  //           .expect(200)
  //           .end(function (storageunitsDeleteErr, storageunitsDeleteRes) {
  //             if (storageunitsDeleteErr) {
  //               return done(storageunitsDeleteErr);
  //             }
  //           setTimeout(function() {
  //               agent.get('/api/storageunits/'+ storageunitObj._id)
  //                 .expect(200)
  //                 .end(function (snapshotGetErr, snapshotGetRes) {
  //                   if (snapshotGetErr) {
  //                     return done(snapshotGetErr);
  //                   }
  //                   storageunit = snapshotGetRes.body;
  //                   (storageunit.name).should.equal(storageunit.name);
  //                   (storageunit.status).should.equal("Deleting");
  //                   storageunitObj.remove();
  //                   done();
  //                 });
  //             });
  //           }, 4000);
  //         });
  //     });
  // });

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
