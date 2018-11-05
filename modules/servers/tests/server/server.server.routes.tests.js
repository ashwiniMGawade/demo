'use strict';

var _ = require('lodash'),
  should = require('should'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Pod = mongoose.model('Pod'),
  Cluster = mongoose.model('ontap_clusters'),
  Tenant = mongoose.model('Tenant'),
  Site = mongoose.model('Site'),
  Icr = mongoose.model('Icr'),
  Subtenant = mongoose.model('Subtenant'),
  Subscription = mongoose.model('Subscription'),
  Server = mongoose.model('Server'),
  Storagegroup = mongoose.model('Storagegroup'),
  nock = require('nock'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, server, site, pod, subtenant, cluster;
var couchdbvFasCreate, couchdbvFasReadStatus, subscription, userRoot, credentialsRoot, icr;
var partnerTenant, tenant1, tenant2, server1, server2, subscription2, subtenant2;

/**
 * Server routes tests
 */
describe('Server CRUD tests', function () {
  before(function (done) {
    // Get application
    this.timeout(10000);
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);

    partnerTenant = new Tenant({
      code:'ptc',
      name:'partnerTenant'
    });

    tenant1 = new Tenant({
      code:'tenant1',
      name:'testTenant1'
    });

    tenant2 = new Tenant({
      code:'tenant2',
      name:'testTenant2'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant1.annotation = 'test';
      tenant2.annotation = 'test';
      partnerTenant.annotation = 'test';
    }

    site = new Site({
      name: 'Melbourne',
      code: 'mel'
    });

    icr = {
      message: 'test message',
      clusterext: 'test cluster text',
      ipsExt: '10.20.30.40, 45.12.34.12'
    };

    subtenant = new Subtenant({
      name: 'Subtenant Name',
      code: 'testsub1'
    });

    subtenant2 = new Subtenant({
      name: 'Subtenant Name2',
      code: 'testsub2'
    });

    cluster = new Cluster({
      name: 'cluster',
      uuid: '19158fba-d063-11e8-b4c4-005056a8f8ff',
      management_ip:"10.20.30.40",
      provisioning_state:"open",
      rest_uri:"http://sample.com",
      user: user
    });

    partnerTenant.save(function(err){
      should.not.exist(err);
      tenant1.partner = partnerTenant;
      tenant1.save(function(err){
        should.not.exist(err);
        tenant2.save(function(err){
          subtenant.tenant = tenant1;
          subtenant.partner = partnerTenant;
          subtenant.save(function(err){
            subtenant2.tenant = tenant2;
            subtenant2.save(function(err){
              done();
            });
          });
        });
      });
    });
  });


  beforeEach(function (done) {
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };
    credentialsRoot = {
      username: 'rootuser',
      password: 'M3@n.jsI$Aw3$0m3'
    };
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      roles: ['admin']
    });

    userRoot = new User({
      firstName: 'Root',
      lastName: 'User',
      displayName: 'Root User',
      email: 'rootuser@test.com',
      username: credentialsRoot.username,
      password: credentialsRoot.password,
      provider: 'local',
      roles: ['root']
    });

    pod = new Pod({
      name: 'mp1',
      code: 'mp1'
    });

    subscription = new Subscription({
      name: 'test subscription',
      code: 'testsub',
      url: 'http://test.com',
      description: 'this is the test subscription',
      partner: partnerTenant
    });

    subscription2 = new Subscription({
      name: 'test subscription2',
      code: 'testsub2',
      url: 'http://test.com',
      description: 'this is the test subscription',
    });

    //initialize subscription pack when prepaid payment method setting is enabled
    if (featuresSettings.paymentMethod.prePaid) {
      subscription.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
      subscription2.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
    }

    //create mock URL
    //mock the response for successful create request
    couchdbvFasCreate= nock('http://wfatestportal.com')
      .post('/vFasCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65370"
            }
          }
        }
      );

    // mock get status request for create
    var couchdbvFasReadStatus= nock('http://wfatestportal.com')
      .get('/vFasCreate/jobs/65370')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    // mock get status request for create
    var couchdbvFasPlanOut= nock('http://wfatestportal.com')
      .get('/vFasCreate/jobs/65370/plan/out')
      .reply(200, {
        "collection":{
            "keyAndValuePair":[
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "code" } }
            ]
          }
        }
      );

    //mock the response for successful update request
    var couchdbvFasUpdate= nock('http://wfatestportal.com')
      .post('/vFasUpdate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65371"
            }
          }
        }
      );

    // mock get status request for update
    var couchdbvFasReadStatusUpdate= nock('http://wfatestportal.com')
      .get('/vFasUpdate/jobs/65371')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    // mock get status request for update
    var couchdbvFasPlanOutUpdate= nock('http://wfatestportal.com')
      .get('/vFasUpdate/jobs/65371/plan/out')
      .reply(200, {
        "collection":{
            "keyAndValuePair":[
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "code" } }
            ]
          }
        }
      );


      //mock the response for successful delete request
    var couchdbvFasDelete= nock('http://wfatestportal.com')
      .post('/vFasDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65372"
            }
          }
        }
      );

    // mock get status request for delete
    var couchdbvFasReadStatusDelete= nock('http://wfatestportal.com')
      .get('/vFasDelete/jobs/65372')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    // mock get status request for delete
    var couchdbvFasPlanOutDelete= nock('http://wfatestportal.com')
      .get('/vFasDelete/jobs/65372/plan/out')
      .reply(200, {
        "collection":{
            "keyAndValuePair":[
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "code" } }
            ]
          }
        }
      );


   // Save a new pod to the test db and create new server
    user.tenant = mongoose.Types.ObjectId(tenant1._id);
    user.save(function (err) {
      should.not.exist(err);
      userRoot.save(function(err){
        should.not.exist(err);
        site.user = mongoose.Types.ObjectId(user._id);
        site.save(function(err) {
          should.not.exist(err);
          cluster.save(function(err) {
            should.not.exist(err);
            pod.site = site;
            pod.cluster_keys = [mongoose.Types.ObjectId(cluster._id)];
            pod.save(function(err) {
              should.not.exist(err);
              subscription.site = site;
              subscription.tenant = tenant1;
              subscription.save(function(err) {
                should.not.exist(err);
                subscription2.site = site;
                subscription2.tenant = tenant2;
                subscription2.save(function(err){
                  should.not.exist(err);
                  server = {
                    name: 'Test Server',
                    siteId: mongoose.Types.ObjectId(site._id),
                    site: site,
                    subtenantId: mongoose.Types.ObjectId(subtenant._id),
                    subtenant: subtenant,
                    subnet: '10.20.30.64/26',
                    user:mongoose.Types.ObjectId(user._id),
                    managed: 'Portal',
                    gateway:'10.20.30.122',
                    code:'code',
                    subscriptionId:mongoose.Types.ObjectId(subscription._id),
                    subscription:subscription
                  };
                  server1 = new Server({
                    name: 'Test Server1',
                    site: site,
                    subtenant: subtenant,
                    subnet: '10.20.30.64/26',
                    managed: 'Portal',
                    gateway:'10.20.30.122',
                    code:'code',
                    tenant: tenant1,
                    subscription:subscription,
                    status: 'Operational'
                  });
                  server2 = new Server({
                    name: 'Test Server2',
                    site: site,
                    subtenant: subtenant2,
                    subnet: '10.20.30.64/26',
                    managed: 'Portal',
                    gateway:'10.20.30.122',
                    code:'code',
                    tenant: tenant2,
                    subscription:subscription2,
                    status: 'Operational'
                  });
                  server1.save(function(err){
                    should.not.exist(err);
                    server2.save(function(err){
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
  });

  it('should not be able to save an server if not logged in', function (done) {
    agent.post('/api/servers')
      .send(server)
      .expect(401)
      .end(function (serverSaveErr, serverSaveRes) {
        // Call the assertion callback
        done(serverSaveErr);
      });
  });

  if (featuresSettings.server.gateway.enabled) {
    it('should not be able to save an server if invalid gateway is provided', function (done) {
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }
          server.gateway = '12.12.12.12';

          // Save a new server
          agent.post('/api/servers')
            .send(server)
            .expect(400)
            .end(function (serverSaveErr, serverSaveRes) {
              serverSaveRes.body.message.should.match('Gateway IP is not in the Subnet');
              done();
          });
        });
    });

    it('should not be able to save an server if invalid gateway(broadcast address) is provided', function (done) {
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }
          server.gateway = '10.20.30.127';

          // Save a new server
          agent.post('/api/servers')
            .send(server)
            .expect(400)
            .end(function (serverSaveErr, serverSaveRes) {
              serverSaveRes.body.message.should.match('Gateway IP cannot be the same as the Subnet Broadcast IP');
              done();
          });
        });
    });

    it('should not be able to save an server if used gatewaty is provided', function (done) {
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }
          server.gateway = '10.20.30.90';

          // Save a new server
          agent.post('/api/servers')
            .send(server)
            .expect(400)
            .end(function (serverSaveErr, serverSaveRes) {
              serverSaveRes.body.message.should.match('Gateway IP is already reserved for the Server');
              done();
          });
        });
    });

    it('should not be able to save an server if used gatewaty is same as that of the subnet', function (done) {
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }
          server.gateway = '10.20.30.64';

          // Save a new server
          agent.post('/api/servers')
            .send(server)
            .expect(400)
            .end(function (serverSaveErr, serverSaveRes) {
              serverSaveRes.body.message.should.match('Gateway IP cannot be the same as the Subnet IP');
              done();
          });
        });
    });
  }

 

  it('should not be able to save an server if subnet is invalid', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        server.subnet = '10.20.30.90/26';

        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(400)
          .end(function (serverSaveErr, serverSaveRes) {
            serverSaveRes.body.message.should.match('Valid IP for subnet after masking is 10.20.30.64');
            done();
        });
      });
  });

  it('should not be able to save an server if managed=customer and password is blank', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        server.managed = 'Customer';
        server.password = '';


        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(400)
          .end(function (serverSaveErr, serverSaveRes) {
            serverSaveRes.body.message.should.match('Password is mandatory if Managed = Customer');
            done();
        });
      });
  });

  it('should not be able to save an server if managed=customer and password is invalid', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        server.managed = 'Customer';
        server.password = '@tsdfs';


        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(400)
          .end(function (serverSaveErr, serverSaveRes) {
            serverSaveRes.body.message.should.match('Password length must be 8-16 characters, contain no special characters, at least a digit and a letter');
            done();
        });
      });
  });

  it('should not be able to save an server if managed=portal and password is not blank', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        server.managed = 'Portal';
        server.password = '@tsdfs';


        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(400)
          .end(function (serverSaveErr, serverSaveRes) {
            serverSaveRes.body.message.should.match('Password must be blank if Managed = Portal');
            done();
        });
      });
  });

  it('should not be able to save an server if no name is provided', function (done) {
    // Invalidate title field
    server.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(400)
          .end(function (serverSaveErr, serverSaveRes) {
            // Set message assertion
            (serverSaveRes.body.message.name).should.match('Server name required');

            // Handle server save error
            done(serverSaveErr);
          });
      });
  });

  it('should not be able to get a single server if not signed in', function (done) {
    // Update new server model instance
    var serverObj = new Server(server);

    // Save the server
    serverObj.save(function () {
      agent.get('/api/servers/' + serverObj._id)
        .expect(401)
        .end(function (req, res) {
          // Set assertion
          //(res.body.message).should.match('Session has expired, please login again to access the resource');

          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to save an server if logged in', function (done) {
    this.timeout(16000);
    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(200)
          .end(function (serverSaveErr, serverSaveRes) {
            // Handle server save error
            if (serverSaveErr) {
              return done(serverSaveErr);
            }
            (serverSaveRes.body.name).should.equal(server.name);

            setTimeout(function() {
            // Get a list of servers
              agent.get('/api/servers')
                .end(function (serversGetErr, serversGetRes) {
                  // Handle server save error
                  if (serversGetErr) {
                    return done(serversGetErr);
                  }

                  // Get servers list
                  var servers = serversGetRes.body;
                  (servers[2].name).should.equal(server.name);
                  (servers[2].status).should.equal('Operational');
                  // Call the assertion callback
                  done();

                });
              }, 15000);
          });
      });
  });

  it('should be able to save an server with the status as contact support if wfa returns success but getuuid is failed to obtain the output', function (done) {
    this.timeout(15000);
    nock.cleanAll();
    couchdbvFasCreate= nock('http://wfatestportal.com')
      .post('/vFasCreate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65370"
            }
          }
        }
      );

    // mock get status request for create
    var couchdbvFasReadStatus= nock('http://wfatestportal.com')
      .get('/vFasCreate/jobs/65370')
      .reply(200, {
        "job":{
            "jobStatus":[{"jobStatus":["COMPLETED"], "phase":["EXECUTION"]}]
          }
        }
      );

    // mock get status request for create
    var couchdbvFasPlanOut= nock('http://wfatestportal.com')
      .get('/vFasCreate/jobs/65370/plan/out')
      .reply(200, {
        "collection":{
            "keyAndValuePair":[
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "57.57.57.5" } },
              {"$":{"value" : "code1" } }
            ]
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server
        server.code = "code1";
        agent.post('/api/servers')
          .send(server)
          .expect(200)
          .end(function (serverSaveErr, serverSaveRes) {
            // Handle server save error
            if (serverSaveErr) {
              return done(serverSaveErr);
            }
            (serverSaveRes.body.name).should.equal(server.name);

            setTimeout(function() {
            // Get a list of servers
              agent.get('/api/servers')
                .end(function (serversGetErr, serversGetRes) {
                  console.log("get is called");
                  // Handle server save error
                  if (serversGetErr) {
                    return done(serversGetErr);
                  }

                  // Get servers list
                  var servers = serversGetRes.body;
                  (servers[2].name).should.equal(server.name);
                  (servers[2].status).should.equal('Contact Support');
                  // Call the assertion callback
                  return done();

                });
              }, 5000);
          });
      });
  });

  it('should be able to populate ipsIcl in create server request for server if managed = customer', function (done) {
    this.timeout(16000);
    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        server.managed = 'Customer';
        server.password = 'Password123';
        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(200)
          .end(function (serverSaveErr, serverSaveRes) {
            // Handle server save error
            if (serverSaveErr) {
              return done(serverSaveErr);
            }
            (serverSaveRes.body.name).should.equal(server.name);
            (serverSaveRes.body.ipsIcl).should.equal('10.20.30.82-89');

            setTimeout(function() {
            // Get a list of servers
              agent.get('/api/servers')
                .end(function (serversGetErr, serversGetRes) {
                  // Handle server save error
                  if (serversGetErr) {
                    return done(serversGetErr);
                  }

                  // Get servers list
                  var servers = serversGetRes.body;
                  (servers[2].name).should.equal(server.name);
                  (servers[2].status).should.equal('Operational');
                  // Call the assertion callback
                  done();

                });
              }, 15000);
          });
      });
  });

  /////////////////////////////////////

  it('should be able to save an server with contact support status if WFA is down', function (done) {
    this.timeout(10000);
    nock.cleanAll();
    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        server.gateway = '';

        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(200)
          .end(function (serverSaveErr, serverSaveRes) {
            // Handle server save error
            if (serverSaveErr) {
              return done(serverSaveErr);
            }
            (serverSaveRes.body.name).should.equal(server.name);

            setTimeout(function() {
            // Get a list of servers
              agent.get('/api/servers')
                .end(function (serversGetErr, serversGetRes) {
                  // Handle server save error
                  console.log("get called");
                  if (serversGetErr) {
                    return done(serversGetErr);
                  }
                  config.wfa.vFasCreateJob = 'http://wfatestportal.com/vFasCreate/jobs';

                  // Get servers list
                  var servers = serversGetRes.body;
                  (servers[2].name).should.equal(server.name);
                  (servers[2].status).should.equal('Contact Support');
                  // Call the assertion callback
                  done();

                });
              }, 900);
          });
      });
  });

  // it('should be able to save an server with contact support status if WFA status read is down', function (done) {
  //   this.timeout(10000);
  //   config.wfa.vFasCreateJob = 'http://wfatestportal.com/vFasCreate/jobs';
  //   nock.cleanAll();
  //   var couchdbvFasReadStatus= nock('http://wfatestportal.com')
  //     .get('/vFasCreate/jobs/65370')
  //     .reply(200, {
  //      }
  //     );

  //   couchdbvFasCreate= nock('http://wfatestportal.com')
  //     .post('/vFasCreate/jobs')
  //     .reply(200, {
  //         "job":{
  //           "$":{
  //             "xmlns:atom":"http://www.w3.org/2005/Atom",
  //             "jobId":"65370"
  //           }
  //         }
  //       }
  //     );

  //   agent.post('/api/auth/signin')
  //     .send(credentialsRoot)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }

  //       // Save a new server
  //       agent.post('/api/servers')
  //         .send(server)
  //         .expect(200)
  //         .end(function (serverSaveErr, serverSaveRes) {
  //           // Handle server save error
  //           if (serverSaveErr) {
  //             return done(serverSaveErr);
  //           }
  //           (serverSaveRes.body.name).should.equal(server.name);

  //           setTimeout(function() {
  //           // Get a list of servers
  //             agent.get('/api/servers')
  //               .end(function (serversGetErr, serversGetRes) {
  //                 // Handle server save error
  //                 if (serversGetErr) {
  //                   return done(serversGetErr);
  //                 }

  //                 // Get servers list
  //                 var servers = serversGetRes.body;
  //                 (servers[2].name).should.equal(server.name);
  //                 (servers[2].status).should.equal('Contact Support');
  //                 // Call the assertion callback
  //                 done();

  //               });
  //             }, 9000);
  //         });
  //     });
  // });

  //############################## update #######################################

  it('should not be able to update an server if server is currently not in operational status', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server
        agent.post('/api/servers')
          .send(server)
          .expect(200)
          .end(function (serverSaveErr, serverSaveRes) {
            // Handle server save error
            if (serverSaveErr) {
              return done(serverSaveErr);
            }
            // Update server
            server.nfs = true;

            // Update an existing server
            agent.put('/api/servers/' + serverSaveRes.body._id)
              .send(server)
              .expect(400)
              .end(function (serverUpdateErr, serverUpdateRes) {
                // Handle server upate error
                if (serverUpdateErr) {
                  return done(serverUpdateErr);
                }
                // Set assertions
                (serverUpdateRes.body.message).should.equal('Server is currently undergoing a different operation. Please wait until Status = Operational');
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to update an server if server is managed by customer and password is invalid', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin errorgrunt
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server

        server.status = 'Operational';
        server.managed = 'Customer';
        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }
          // Update server
          server.password = 'cudy@';

          // Update an existing server
          agent.put('/api/servers/' + serverSaveRes._id)
            .send(server)
            .expect(400)
            .end(function (serverUpdateErr, serverUpdateRes) {
              // Handle server upate error
              if (serverUpdateErr) {
                return done(serverUpdateErr);
              }
              // Set assertions
              (serverUpdateRes.body.message).should.equal('Password length must be at least 8, must contain both characters and digits & no special characters are allowed');
              serverObj.remove();
              // Call the assertion callback
              done();
            });
          });
      });
  });

  it('should not be able to update an server if server is managed by portal and password is specified', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server

        server.status = 'Operational';
        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }
          // Update server
          server.managed = 'Portal';
          server.password = 'Customer@';

          // Update an existing server
          agent.put('/api/servers/' + serverSaveRes._id)
            .send(server)
            .expect(400)
            .end(function (serverUpdateErr, serverUpdateRes) {
              // Handle server upate error
              if (serverUpdateErr) {
                return done(serverUpdateErr);
              }
              // Set assertions
              (serverUpdateRes.body.message).should.equal('Password must be blank if Managed = Portal');
              serverObj.remove();
              // Call the assertion callback
              done();
            });
          });
      });
  });

  it('should not be able to update a server to disable nfs once enabled (Portal Managed)', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server

        server.status = 'Operational';
        server.nfs = true;
        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }
          // Update server
          server.nfs = false;

          // Update an existing server
          agent.put('/api/servers/' + serverSaveRes._id)
            .send(server)
            .expect(400)
            .end(function (serverUpdateErr, serverUpdateRes) {
              // Handle server upate error
              if (serverUpdateErr) {
                return done(serverUpdateErr);
              }
              // Set assertions
              (serverUpdateRes.body.message).should.equal('Cannot disable NFS once enabled');
              serverObj.remove();
              // Call the assertion callback
              done();
            });
          });
      });
  });

  it('should not be able to update a server to disable cifs once enabled (Portal Managed)', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server

        server.status = 'Operational';
        server.cifs = true;
        server.cifsDnsDomain = 'dnsname';
        server.cifsDnsServers = '10.20.12.25';
        server.cifsDomain = 'domain';
        server.cifsServername = 'cifsservername';

        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }
          // Update server
          server.cifs = false;

          // Update an existing server
          agent.put('/api/servers/' + serverSaveRes._id)
            .send(server)
            .expect(400)
            .end(function (serverUpdateErr, serverUpdateRes) {
              // Handle server upate error
              if (serverUpdateErr) {
                return done(serverUpdateErr);
              }
              // Set assertions
              (serverUpdateRes.body.message).should.equal('Cannot disable CIFS once enabled');
              serverObj.remove();
              // Call the assertion callback
              done();
            });
          });
      });
  });

  it('should not be able to update a server to disable iscsi once enabled (Portal Managed)', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server

        server.status = 'Operational';
        server.iscsi = true;

        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }
          // Update server
          server.iscsi = false;

          // Update an existing server
          agent.put('/api/servers/' + serverSaveRes._id)
            .send(server)
            .expect(400)
            .end(function (serverUpdateErr, serverUpdateRes) {
              // Handle server upate error
              if (serverUpdateErr) {
                return done(serverUpdateErr);
              }
              // Set assertions
              (serverUpdateRes.body.message).should.equal('Cannot disable ISCSI once enabled');
              serverObj.remove();
              // Call the assertion callback
              done();
            });
          });
      });
  });

  it('should be able to update an server if signed in, with default values for parameter if not spcified', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new server
        server.status = 'Operational';

        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (err, serverSaveRes) {
            // Update server
          server.nfs = true;

          // Update an existing server
          agent.put('/api/servers/' + serverSaveRes._id)
            .send(server)
            .expect(200)
            .end(function (serverUpdateErr, serverUpdateRes) {
              // Handle server upate error
              if (serverUpdateErr) {
                return done(serverUpdateErr);
              }

              // Set assertions
              (serverUpdateRes.body.name).should.equal(serverSaveRes.name);
              (serverUpdateRes.body.nfs).should.match(true);
              serverObj.remove();

              // Call the assertion callback
              done();
            });
        });
      });
  });

  // not to commment out
  // it('should be able to update an server with contact support status if WFA is down', function (done) {
  //   this.timeout(15000);
  //   config.wfa.vFasUpdateJob = 'http://wfatestportal.com/vFasUpdate/failjobs';
  //   agent.post('/api/auth/signin')
  //     .send(credentialsRoot)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //
  //       // Save a new server
  //       server.status = 'Operational';
  //       server.name = 'wfa down';
  //
  //       var serverObj = new Server(server);
  //
  //       // Save the server
  //       serverObj.save(function (err, serverSaveRes) {
  //       // Get a list of servers
  //         server.nfs = true;
  //         agent.put('/api/servers/' + serverSaveRes._id)
  //           .expect(200)
  //           .send(server)
  //           .end(function (serversUpdateErr, serversUpdateRes) {
  //             // Handle server save error
  //             if (serversUpdateErr) {
  //               return done(serversUpdateErr);
  //             }
  //             setTimeout(function() {
  //               agent.get('/api/servers/')
  //                 .end(function (serversGetErr, serversGetRes) {
  //                   // Handle server save error
  //                   if (serversGetErr) {
  //                     return done(serversGetErr);
  //                   }
  //                   config.wfa.vFasUpdateJob = 'http://wfatestportal.com/vFasUpdate/jobs';
  //                    // Get servers list
  //                   var servers = serversGetRes.body;
  //                   (servers[2].name).should.equal(server.name);
  //                   (servers[2].status).should.equal('Contact Support');
  //                   serverObj.remove();
  //                   // Call the assertion callback
  //                   done();
  //                 });
  //
  //             });
  //           }, 12000);
  //         });
  //     });
  // });

  it('should be able to update an server invariant to WFA when changing name only', function (done) {
    this.timeout(10000);
    config.wfa.vFasUpdateJob = 'http://wfatestportal.com/vFasUpdate/failjobs';
    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new server
        server.status = 'Operational';
        server.name = 'name only change';

        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (err, serverSaveRes) {
        // Get a list of servers
          agent.put('/api/servers/' + serverSaveRes._id)
            .expect(200)
            .send(server)
            .end(function (serversUpdateErr, serversUpdateRes) {
              // Handle server save error
              if (serversUpdateErr) {
                return done(serversUpdateErr);
              }
              setTimeout(function() {
                agent.get('/api/servers/')
                  .end(function (serversGetErr, serversGetRes) {
                    // Handle server save error
                    if (serversGetErr) {
                      return done(serversGetErr);
                    }
                    config.wfa.vFasUpdateJob = 'http://wfatestportal.com/vFasUpdate/jobs';
                     // Get servers list
                    var servers = serversGetRes.body;
                    (servers[2].name).should.equal(server.name);
                    (servers[2].status).should.equal('Operational');
                    serverObj.remove();
                    // Call the assertion callback
                    done();
                  });

              });
            }, 9000);
          });
      });
  });

  it('should be able to update an server with contact support status if WFA status read is down', function (done) {
    this.timeout(15000);
    nock.cleanAll();
    var couchdbvFasUpdateStatus= nock('http://wfatestportal.com')
      .get('/vFasUpdate/jobs/65379')
      .reply(200, {
       }
      );

    var couchdbvFasUpdate= nock('http://wfatestportal.com')
      .post('/vFasUpdate/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65379"
            }
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new server
        server.status = 'Operational';
        server.name = 'test';

        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (err, serverSaveRes) {
          server.nfs = true;
          // Get a list of servers
            agent.put('/api/servers/' + serverSaveRes._id)
              .expect(200)
              .send(server)
              .end(function (serversUpdateErr, serversUpdateRes) {
                // Handle server save error
                if (serversUpdateErr) {
                  return done(serversUpdateErr);
                }
                setTimeout(function() {
                  agent.get('/api/servers/')
                    .end(function (serversGetErr, serversGetRes) {
                      // Handle server save error
                      if (serversGetErr) {
                        return done(serversGetErr);
                      }
                       // Get servers list
                      var servers = serversGetRes.body;
                      (servers[2].name).should.equal(server.name);
                      (servers[2].status).should.equal('Contact Support');
                      serverObj.remove();
                      // Call the assertion callback
                      done();
                    });
                }, 12000);
              });
          });
      });
  });

  it('should not be able to update an server if signed in, but not authorized', function (done) {
    user.roles = ['read'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }
          // Save a new server
          agent.post('/api/servers')
            .send(server)
            .expect(403)
            .end(function (serverSaveErr, serverSaveRes) {
              // Handle server save error
              if (serverSaveErr) {
                return done(serverSaveErr);
              }
              (serverSaveRes.body.message).should.match('User is not authorized');
              done(serverSaveErr);
            });
        });
    });
  });

  it('should be able to update an server if root and fromfix param is set', function (done) {

    userRoot.save(function (err, user) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsRoot)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          server.status = 'Operational';
          server.name = 'test';
          server.podId = pod._id;

          var serverObj = new Server(server);

          // Save the server
          serverObj.save(function (err, serverSaveRes) {
            // Save a updated server
            should.not.exist(err);
            server.status = 'Contact Support';
            server.fromFix  = true;
            agent.put('/api/servers/'+ serverSaveRes._id)
              .send(server)
              .expect(200)
              .end(function (serverSaveErr, serverSaveRes) {
                // Handle server save error
                if (serverSaveErr) {
                  return done(serverSaveErr);
                }
                (serverSaveRes.body.status).should.equal(server.status);
                done(serverSaveErr);
              });
            });
        });
    });
  });

  it('should not be able to get a list of servers if not signed in', function (done) {
    // Create new server model instance
    var serverObj = new Server(server);

    // Save the server
    serverObj.save(function () {
      // Request servers
      request(app).get('/api/servers')
        .expect(401)
        .end(function (req, res) {
          // Set assertion
          //(res.body.message).should.match('Session has expired, please login again to access the resource');

          // Call the assertion callback
          done();
        });

    });
  });

  it('should return proper error for single server with an invalid Id, if  signed in', function (done) {
    // test is not a valid mongoose Id
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        request(app).get('/api/servers/test')
          .end(function (req, res) {
            // Set assertion
            res.body.should.be.instanceof(Object).and.have.property('message', 'Server is invalid');

            // Call the assertion callback
            done();
          });
      });
   });

  it('should return proper error for single server which doesn\'t exist, if signed in', function (done) {
    // This is a valid mongoose Id but a non-existent server
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        agent.get('/api/servers/559e9cd815f80b4c256a8f41')
          .end(function (req, res) {
            // Set assertion
            res.body.should.be.instanceof(Object).and.have.property('message', 'No server with that identifier has been found');

            // Call the assertion callback
            done();
          });
      });
  });

  it('should return the details of single server if signed in', function (done) {
    // This is a valid mongoose Id but a non-existent server
    this.timeout(10000);
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Create new server model instance
        var serverObj = new Server(server);
        // Save the server
        serverObj.save(function (err) {
          should.not.exist(err);
          // Request servers
          agent.get('/api/servers/' + serverObj._id)
            //.expect(200)
            .end(function (err, res) {
              // Handle server save error
              if (err) {
                return done(err);
              }
              // Call the assertion callback
              done();
            });
        });
      });
  });

  // //########################### delete ###############################

  it('should not  be able to delete an server if status is not operational', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }

          // Delete an existing server
          agent.delete('/api/servers/' + serverSaveRes._id)
            .expect(400)
            .end(function (serverDeleteErr, serverDeleteRes) {
              // Handle server error error
              if (serverDeleteErr) {
                return done(serverDeleteErr);
              }
              (serverDeleteRes.body.message).should.match('Server is currently undergoing a different operation. Please wait until Status = Operational');
              // Call the assertion callback
              done();
            });
          });
      });
  });

  it('should be able to delete an server if status is operational', function (done) {
    this.timeout(10000);
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        var serverObj = new Server(server);
        serverObj.status = 'Operational';

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }

          // Delete an existing server
          agent.delete('/api/servers/' + serverSaveRes._id)
            .expect(200)
            .end(function (serverDeleteErr, serverDeleteRes) {
              // Handle server error error
              if (serverDeleteErr) {
                return done(serverDeleteErr);
              }
              setTimeout(function() {
              // Get a list of servers
                agent.get('/api/servers/'+serverSaveRes._id)
                .expect(404)
                .end(function (serversGetErr, serversGetRes) {
                  // Handle server save error
                  if (serversGetErr) {
                    return done(serversGetErr);
                  }
                  // Call the assertion callback
                  done();

                });
              }, 5000);
            });
          });
      });
  });


  it('should not be able to delete an server if status is operational but wfa fails to return', function (done) {
    this.timeout(1000);
    nock.cleanAll();
    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        var serverObj = new Server(server);
        serverObj.status = 'Operational';

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }

          // Delete an existing server
          agent.delete('/api/servers/' + serverSaveRes._id)
            .expect(200)
            .end(function (serverDeleteErr, serverDeleteRes) {
              // Handle server error error
              if (serverDeleteErr) {
                return done(serverDeleteErr);
              }
              setTimeout(function() {
              // Get a list of servers
                agent.get('/api/servers/')
                .expect(200)
                .end(function (serversGetErr, serversGetRes) {
                  // Handle server save error
                  if (serversGetErr) {
                    return done(serversGetErr);
                  }
                  config.wfa.vFasDeleteJob = 'http://wfatestportal.com/vFasDelete/jobs';
                   // Get servers list
                  var servers = serversGetRes.body;
                  console.log("servers", servers, server);
                  (servers[2].name).should.equal(server.name);
                  (servers[2].status).should.equal('Contact Support');
                  serverObj.remove();
                  // Call the assertion callback
                  done();

                });
              }, 500);
            });
          });
      });
  });

  it('should not be able to delete an server with contact support status if WFA status read is down', function (done) {
    this.timeout(10000);
    nock.cleanAll();
    var couchdbvFasDeleteStatus= nock('http://wfatestportal.com')
      .get('/vFasDelete/jobs/65377')
      .reply(200, {
       }
      );

    var couchdbvFasDelete= nock('http://wfatestportal.com')
      .post('/vFasDelete/jobs')
      .reply(200, {
          "job":{
            "$":{
              "xmlns:atom":"http://www.w3.org/2005/Atom",
              "jobId":"65377"
            }
          }
        }
      );

    agent.post('/api/auth/signin')
      .send(credentialsRoot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new server
        server.status = 'Operational';
        server.name = 'test';

        var serverObj = new Server(server);

        // Save the server
        serverObj.save(function (err, serverSaveRes) {
          // Get a list of servers
            agent.delete('/api/servers/' + serverSaveRes._id)
              .end(function (serversUpdateErr, serversUpdateRes) {
                // Handle server save error
                if (serversUpdateErr) {
                  return done(serversUpdateErr);
                }
                setTimeout(function() {
                  agent.get('/api/servers')
                    .end(function (serversGetErr, serversGetRes) {
                      // Handle server save error
                      if (serversGetErr) {
                        return done(serversGetErr);
                      }
                       // Get servers list
                      var servers = serversGetRes.body;
                      (servers[2].name).should.equal(server.name);
                      (servers[2].status).should.equal('Contact Support');
                      // Call the assertion callback
                      done();
                    });
                }, 9000);
              });

          });
      });
  });

  it('should not be able to delete an server if signed in, but has storage group dependancy', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new server
        var serverObj = new Server(server);
        serverObj.status = 'Operational';

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }

          var storage_group = new Storagegroup({
            name: 'storage group name',
            server: mongoose.Types.ObjectId(serverSaveRes._id),
            code: 'sgtest'
          });

          storage_group.save(function (err) {
            should.not.exists(err);
            // Delete an existing server
            agent.delete('/api/servers/' + serverSaveRes._id)
              .send(server)
              .expect(400)
              .end(function (serverDeleteErr, serverDeleteRes) {
                // Handle server error error
                if (serverDeleteErr) {
                  return done(serverDeleteErr);
                }

                // Set assertions
                (serverDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated Storage Groups are deleted');

                // Call the assertion callback
                done();
              });
          });
        });
      });
  });

  it('should not be able to delete an server if signed in, but has ICR dependancy with ICR status other than `closed`', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new server
        var serverObj = new Server(server);
        serverObj.status = 'Operational';
        serverObj.managed = 'Customer';
        serverObj.password = 'Customer';

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }

          var icrObject = new Icr({
            user: user,
            message: 'test message',
            clusterExt: 'test cluster text',
            ipsExt: '10.20.30.40, 45.12.34.12',
            tenant: tenant1,
            server:serverSaveRes._id,
            status : 'Creating'
          });

          icrObject.save(function (err) {
            should.not.exists(err);
            // Delete an existing server
            agent.delete('/api/servers/' + serverSaveRes._id)
              .send(server)
              .expect(400)
              .end(function (serverDeleteErr, serverDeleteRes) {
                // Handle server error error
                if (serverDeleteErr) {
                  return done(serverDeleteErr);
                }

                // Set assertions
                (serverDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated ICRs are deleted.');
                Icr.remove();
                serverObj.remove();
                // Call the assertion callback
                done();
              });
          });
        });
      });
  });

  it('should  be able to delete an server if signed in, but has ICR dependancy with ICR status is  `closed`', function (done) {
    this.timeout(8000);
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new server
        var serverObj = new Server(server);
        serverObj.status = 'Operational';
        serverObj.managed = 'Customer';
        serverObj.password = 'Customer';

        // Save the server
        serverObj.save(function (serverSaveErr, serverSaveRes) {
          // Handle server save error
          if (serverSaveErr) {
            return done(serverSaveErr);
          }

          var icrObject = new Icr({
            user: user,
            message: 'test message',
            clusterExt: 'test cluster text',
            ipsExt: '10.20.30.40, 45.12.34.12',
            tenant: tenant1,
            server:serverSaveRes._id,
            status : 'Closed'
          });

          icrObject.save(function (err) {
            should.not.exists(err);
            // Delete an existing server
            agent.delete('/api/servers/' + serverSaveRes._id)
              .send(server)
              .expect(200)
              .end(function (serverDeleteErr, serverDeleteRes) {
                // Handle server error error
                // Handle server error error
              if (serverDeleteErr) {
                return done(serverDeleteErr);
              }
              serverObj.remove();
              setTimeout(function() {
              // Get a list of servers
                agent.get('/api/servers/'+serverSaveRes._id)
                .expect(404)
                .end(function (serversGetErr, serversGetRes) {
                  // Handle server save error
                  if (serversGetErr) {
                    return done(serversGetErr);
                  }
                  // Call the assertion callback
                  done();

                });
              }, 5000);
              });
          });
        });
      });
  });


  it('should not be able to delete an server if not signed in', function (done) {
    // Set server user
    server.user = user;

    // Create new server model instance
    var serverObj = new Server(server);

    // Save the server
    serverObj.save(function () {
      // Try deleting server
      agent.delete('/api/servers/' + serverObj._id)
        .expect(401)
        .end(function (serverDeleteErr, serverDeleteRes) {
          // Set message assertion
          //(serverDeleteRes.body.message).should.match('Session has expired, please login again to access the resource');

          // Handle server error error
          done(serverDeleteErr);
        });

    });
  });

  if(_.includes(featuresSettings.roles.server.list,'partner')){
    it('should be able to list the servers under his partnership if signed in with partner', function (done) {
      userRoot.roles = ['partner'];
      userRoot.tenant = partnerTenant;
      userRoot.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentialsRoot)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get a list of servers
            agent.get('/api/servers')
              .expect(200)
              .end(function (serverErr, serverRes) {
                if (serverErr) {
                  return done(serverErr);
                }
                // Get servers list
                var servers = serverRes.body;
                // Set assertions
                (servers[0].name).should.equal('Test Server1');
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.server.update,'partner')){
    it('should be able to update the server under his partnership if signed in with partner', function (done) {
      userRoot.roles = ['partner'];
      userRoot.tenant = partnerTenant;
      userRoot.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentialsRoot)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            server1.name = 'testing1';
            agent.put('/api/servers/'+server1._id)
              .send(server1)
              .expect(200)
              .end(function (serverErr, serverRes) {
                if (serverErr) {
                  return done(serverErr);
                }
                // Get servers list
                var servers = serverRes.body;
                // Set assertions
                (servers.name).should.equal('testing1');
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to update the server not under his partnership if signed in with partner', function (done) {
      userRoot.roles = ['partner'];
      userRoot.tenant = partnerTenant;
      userRoot.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentialsRoot)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            server2.name = 'testing1';
            agent.put('/api/servers/'+server2._id)
              .send(server2)
              .expect(403)
              .end(function (serverErr, serverRes) {
                if (serverErr) {
                  return done(serverErr);
                }
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.server.delete,'partner')){
    it('should be able to delete the server under his partnership if signed in with partner', function (done) {
      userRoot.roles = ['partner'];
      userRoot.tenant = partnerTenant;
      userRoot.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentialsRoot)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            agent.delete('/api/servers/'+server1._id)
              .expect(200)
              .end(function (serverErr, serverRes) {
                if (serverErr) {
                  return done(serverErr);
                }
                done();
              });
          });
      });
    });

    it('should not be able to delete the server not under his partnership if signed in with partner', function (done) {
      userRoot.roles = ['partner'];
      userRoot.tenant = partnerTenant;
      userRoot.save(function (err) {
        should.not.exists(err);
        agent.post('/api/auth/signin')
          .send(credentialsRoot)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            agent.delete('/api/servers/'+server2._id)
              .expect(403)
              .end(function (serverErr, serverRes) {
                if (serverErr) {
                  return done(serverErr);
                }
                done();
              });
          });
      });
    });
  }

  afterEach(function (done) {
    User.remove().exec(function () {
       Subscription.remove().exec(function() {
        Server.remove().exec(function() {
          nock.cleanAll();
          Pod.remove().exec(done);
        });
      });
    });
   });

  after(function(done) {
    tenant1.remove();
    site.remove();
    subtenant.remove();
    done();
  });
});
