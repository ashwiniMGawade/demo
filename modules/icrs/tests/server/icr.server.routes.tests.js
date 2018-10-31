'use strict';

var should = require('should'),
  request = require('supertest'),
  _ = require('lodash'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  Subscription = mongoose.model('Subscription'),
  Server = mongoose.model('Server'),
  Site = mongoose.model('Site'),
  Pod = mongoose.model('Pod'),
  Icr = mongoose.model('Icr'),
  Subtenant = mongoose.model('Subtenant'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, credentialsRead, user, userRead, icr, pod, site;
var subtenant1, subtenant2, icr1, icr2, server1, server2, tenant1, tenant2, subscription1, subscription2, partnerTenant;

/**
 * Subtenant routes tests
 */
describe('ICRS CRUD tests', function () {

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
      username: 'readuser',
      password: 'M3@n.jsI$Aw3$0m3'
    };
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3',
      roles: ['root'],
      provider:'local'
    });

    userRead = new User({
      firstName: 'read user',
      lastName: 'User',
      displayName: 'read User',
      email: 'readusertest@test.com',
      username: 'readuser',
      password: 'M3@n.jsI$Aw3$0m3',
      roles: ['read'],
      provider:'local'
    });

    partnerTenant = new Tenant({
      code:'ptc',
      name:'partnerTenant'
    });

    tenant1 = new Tenant({
      name: 'Tenant Name',
      code: 'tttt'
    });

    tenant2 = new Tenant({
      name: 'Tenant Names',
      code: 'ttttts'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant1.annotation = 'test';
      tenant2.annotation = 'test';
      partnerTenant.annotation = 'test';
    }

    pod = new Pod({
      name: 'Test Pod',
      code: 'tpd'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
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

    icr1 = new Icr({
      message: 'test message',
      clusterExt: 'test cluster text',
      ipsExt: '10.20.30.40, 45.12.34.12'
    });

    icr2 = new Icr({
      message: 'test message two',
      clusterExt: 'test cluster text',
      ipsExt: '10.20.30.40, 45.12.34.12'
    });

    //initialize subscription pack when prepaid payment method setting is enabled
    if (featuresSettings.paymentMethod.prePaid) {
      subscription1.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
      subscription2.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
    }

    subtenant1 = new Subtenant({
      name: 'Test SubTenant',
      code: 'sssss',
    });

    subtenant2 = new Subtenant({
      name: 'Test SubTenant two',
      code: 'ssssstwo',
    });

    site.save(function(err){
      should.not.exist(err);
      pod.site = site;
      pod.save(function(err){
      });
    });
    
    partnerTenant.save(function(err) {
      should.not.exist(err);
      tenant1.partner = partnerTenant;
      tenant1.save(function (err) {
        should.not.exist(err);
        tenant2.save(function(err) {
          should.not.exist(err);
          user.tenant = tenant1;
          userRead.tenant = tenant1;     
          user.save(function(err){
            should.not.exist(err);
            userRead.save(function(err){
              should.not.exist(err);
              subtenant1.tenant = tenant1;
              subtenant1.partner = partnerTenant;
              subtenant2.tenant = tenant2;
              subscription1.partner = partnerTenant;
              subscription1.tenant = tenant1;
              subscription2.tenant = tenant2;
              subtenant1.save(function(err){
                should.not.exist(err);
                subtenant2.save(function(err){
                  should.not.exist(err);
                  subscription1.site = site;
                  subscription2.site = site;  
                  subscription1.save(function(err) {
                    should.not.exist(err);
                    subscription2.save(function(err) {
                      should.not.exist(err);
                      server1 = new Server({
                        name: 'Test VFas',
                        site: site,
                        pod: pod,
                        subtenant: subtenant1,
                        managed: 'Customer',
                        subnet: '10.23.12.0/26',
                        code: 'testVfas',
                        status:'Operational',
                        subscription: subscription1
                      });

                      server2 = new Server({
                        name: 'Test VFas',
                        site: site,
                        pod: pod,
                        subtenant: subtenant2,
                        managed: 'Customer',
                        subnet: '10.23.12.0/26',
                        code: 'testVfas',
                        status:'Operational',
                        subscription: subscription2
                      });
                      server1.save(function(err) {
                        should.not.exist(err);
                        server2.save(function(err) {
                          should.not.exist(err);
                          icr1.tenant = tenant1;
                          icr1.server = server1;
                          icr2.tenant = tenant2;
                          icr2.server = server2;
                          icr1.save(function(err) {
                            should.not.exist(err);
                            icr2.save(function(err) {
                              should.not.exist(err);
                              icr = {
                                user: user,
                                message: 'test message',
                                clusterExt: 'test cluster text',
                                ipsExt: '10.20.30.40, 45.12.34.12',
                                tenant: tenant1,
                                tenantId: tenant1._id,
                                server:server1,
                                serverId:server1._id
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

////////////////////////// create ////////////////////////////////////////////////

  it('should not be able to save an icrs if not logged in', function (done) {
    agent.post('/api/icrs')
      .send(icr)
      .expect(401)
      .end(function (subtenantSaveErr, subtenantSaveRes) {
        // Call the assertion callback
        done(subtenantSaveErr);
      });

  });

  it('should not be able to save an icrs if logged in and but not authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save a new icr
      agent.post('/api/icrs')
        .send(icr)
        .expect(403)
        .end(function (icrSaveErr, icrSaveRes) {
          // Handle icr save error
          if (icrSaveErr) {
            return done(icrSaveErr);
          }
          done(icrSaveErr);
        });
    });
  });
  
  it('should NOT be able to save an icrs if server belongs to different tenant', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      icr.tenantId = tenant2._id;
      // Save a new icr
      agent.post('/api/icrs')
        .send(icr)
        .expect(400)
        .end(function (icrSaveErr, icrSaveRes) {
          // Handle icr save error
          if (icrSaveErr) {
            return done(icrSaveErr);
          }
          // Get a list of icrs
         (icrSaveRes.body.message).should.equal("Invalid Server ID.");
         done();
        });
    });
  });

  it('should be able to save an icrs if logged in and authorized user is root', function (done) {
    user.roles = ['root'];
    user.save(function(err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new icr
        agent.post('/api/icrs')
          .send(icr)
          .expect(200)
          .end(function (icrSaveErr, icrSaveRes) {
            // Handle icr save error
            if (icrSaveErr) {
              return done(icrSaveErr);
            }
            // Get a list of icrs
            agent.get('/api/icrs')
              .end(function (icrsGetErr, icrsGetRes) {
                // Handle icr save error
                if (icrsGetErr) {
                  return done(icrsGetErr);
                }

                // Get icrs list
                var icrs = icrsGetRes.body;

                // Set assertions
                (icrs[0].message).should.equal(icr.message);
                // Call the assertion callback
                done();
              });
          });
      });
    });

  });

  it('should be able to save an icrs if logged in and authorized user is root', function (done) {
    user.roles = ['root'];
    user.username = credentials.username;
    user.password = credentials.password;
    user.save(function(err) {
      agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new icr
        agent.post('/api/icrs')
          .send(icr)
          //.expect(200)
          .end(function (icrSaveErr, icrSaveRes) {
            // Handle icr save error
            if (icrSaveErr) {
              return done(icrSaveErr);
            }
            // Get a list of icrs

            (icrSaveRes.body.tenant.name).should.equal(tenant1.name);
            done();

          });
      });
    });

  });

  it('should not be able to save an icr if no message is provided', function (done) {
    // Invalidate message field
    icr.message = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new icr
        agent.post('/api/icrs')
          .send(icr)
          .expect(400)
          .end(function (icrSaveErr, icrSaveRes) {
            // Set message assertion
            (icrSaveRes.body.message).should.match('Message required.');
            // Handle icr save error
            done(icrSaveErr);
          });
      });
  });

  /////////////////////////////////////////update //////////////////////////////////////

  it('should be able to update an icr if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new icr
        agent.post('/api/icrs')
          .send(icr)
          .expect(200)
          .end(function (icrSaveErr, icrSaveRes) {
            // Handle icr save error
            if (icrSaveErr) {
              return done(icrSaveErr);
            }

            // Update icr name
            icr.message = 'Updated icr message';

            // Update an existing icr
            agent.put('/api/icrs/' + icrSaveRes.body.icrId)
              .send(icr)
              .expect(200)
              .end(function (icrUpdateErr, icrUpdateRes) {
                // Handle icr update error
                if (icrUpdateErr) {
                  return done(icrUpdateErr);
                }

                // Set assertions
                (icrUpdateRes.body.icrId).should.equal(icrSaveRes.body.icrId);
                (icrUpdateRes.body.message).should.match('Updated icr message');

                // Call the assertion callback
                done();
              });
          });
      });
  });


  it('should not be able to update an icr if status is closed', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new icr
        icr.status = 'Closed';
        var icrObj = new Icr(icr);

        icrObj.save(function(err){
          should.not.exist(err);
          agent.put('/api/icrs/' + icrObj._id)
            .send(icr)
            .expect(400)
            .end(function (icrUpdateErr, icrUpdateRes) {
              // Handle icr update error
              if (icrUpdateErr) {
                return done(icrUpdateErr);
              }
              (icrUpdateRes.body.message).should.match('Can not update the Closed ICR');
              // Call the assertion callback
              done();
            });
        });
      });
  });

  it('should not be able to update an icr if message is blank', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new icr
        agent.post('/api/icrs')
          .send(icr)
          .expect(200)
          .end(function (icrSaveErr, icrSaveRes) {
            // Handle icr save error
            if (icrSaveErr) {
              return done(icrSaveErr);
            }

            // Update icr name
            icr.message = '';

            // Update an existing icr
            agent.put('/api/icrs/' + icrSaveRes.body.icrId)
              .send(icr)
              .expect(400)
              .end(function (icrUpdateErr, icrUpdateRes) {
                // Handle icr update error
                if (icrUpdateErr) {
                  return done(icrUpdateErr);
                }
                (icrUpdateRes.body.message).should.match('Message required.');

                // Call the assertion callback
                done();
              });
          });
      });
  });


  ///////////////////////////////// list ////////////////////////////////////////

  it('should not be able to get a list of icrs if not signed in', function (done) {
    // Create new icr model instance
    var icrObj = new Icr(icr);

    // Save the icr
    icrObj.save(function () {
      // Request icrs
      request(app).get('/api/icrs')
        .expect(401)
        .end(function (err, res) {
          // Call the assertion callback
          done(err);
        });

    });
  });

  it('should not be able to get a single icr if not signed in', function (done) {
    // Create new icr model instance
    var icrObj = new Icr(icr);

    // Save the icr
    icrObj.save(function () {
      request(app).get('/api/icrs/' + icrObj._id)
        .expect(401)
        .end(function (err, res) {
          // Call the assertion callback
          done(err);
        });
    });
  });

  it('should be able to get an icr if signed in and authorized with read user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save a new icr
      agent.post('/api/icrs')
        .send(icr)
        .expect(200)
        .end(function (icrSaveErr, icrSaveRes) {
          // Handle icr save error
          if (icrSaveErr) {
            return done(icrSaveErr);
          }

          // login with the read user
          agent.post('/api/auth/signin')
          .send(credentialsRead)
          .expect(200)
          .end(function (signinErr, signinRes) {
            // Handle signin error
            if (signinErr) {
              return done(signinErr);
            }
            // Get an existing icr
            agent.get('/api/icrs/' + icrSaveRes.body.icrId)
              .send(icr)
              .expect(200)
              .end(function (icrErr, icrRes) {
                // Handle icr update error
                if (icrErr) {
                  return done(icrErr);
                }
                // Set assertions
                (icrSaveRes.body.icrId).should.equal(icrRes.body.icrId);
                // Call the assertion callback
                done();
              });
          });
        });
    });
  });

  it('should noy be able to get an icr if signed in and authorized with read user of other tenant', function (done) {
    // login with the read user
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get an existing icr
      agent.get('/api/icrs/' + icr2._id)
        .expect(403)
        .end(function (icrErr, icrRes) {          
          done();
        });
    });
  });

  it('should return proper error for single icr with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    agent.get('/api/icrs/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Icr is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single icr which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent subtenant
    agent.get('/api/icrs/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No icr with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  ///////////////////////////////// DELETE ////////////////////////////////////

  it('should be able to delete an icr if signed in with root user', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new icr
        agent.post('/api/icrs')
          .send(icr)
          .expect(200)
          .end(function (icrSaveErr, icrSaveRes) {
            // Handle icr save error
            if (icrSaveErr) {
              return done(icrSaveErr);
            }

            // Delete an existing icr
            agent.delete('/api/icrs/' + icrSaveRes.body.icrId)
              .send(icr)
              .expect(200)
              .end(function (icrDeleteErr, icrDeleteRes) {
                // Handle icr error error
                if (icrDeleteErr) {
                  return done(icrDeleteErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to change the ICR status to deleting when delete ICR request is sent by admin user', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new icr
        agent.post('/api/icrs')
          .send(icr)
          .expect(200)
          .end(function (icrSaveErr, icrSaveRes) {
            // Handle icr save error
            if (icrSaveErr) {
              return done(icrSaveErr);
            }

            userRead.roles = ['admin'];
            userRead.save(function(err) {
              should.not.exist(err);
              agent.post('/api/auth/signin')
              .send(credentialsRead)
              .expect(200)
              .end(function (signinErr, signinRes) {
                // Handle signin error
                if (signinErr) {
                  return done(signinErr);
                }             

                // Delete an existing icr
                agent.delete('/api/icrs/' + icrSaveRes.body.icrId)
                  .send(icr)
                  .expect(200)
                  .end(function (icrDeleteErr, icrDeleteRes) {
                    // Handle icr error error
                    if (icrDeleteErr) {
                      return done(icrDeleteErr);
                    }

                    agent.get('/api/icrs/' + icrSaveRes.body.icrId)
                      .expect(200)
                      .end(function (icrGetErr, icrGetRes) {
                        (icrGetRes.body.status).should.be.equal('Deleting');
                         // Call the assertion callback
                        done();
                      });                   
                  });
              });
            });
          });
      });
  });


  it('should not be able to delete an icr if not signed in', function (done) {
    // Set icr user
    icr.user = user;

    // Create new icr model instance
    var icrObj = new Icr(icr);

    // Save the icr
    icrObj.save(function () {
      // Try deleting icr
      request(app).delete('/api/icrs/' + icrObj._id)
        .expect(401)
        .end(function (icrDeleteErr, icrDeleteRes) {
          // Set message assertion
          //(icrDeleteRes.body.message).should.match('Session has expired, please login again to access the resource');

          // Handle icr error error
          done(icrDeleteErr);
        });

    });
  });

  if(_.includes(featuresSettings.roles.icr.read, 'partner')){
    it('should be able to get the icr under his partnership if signed in with partner', function (done) {
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
            // Get a list of icrs
            agent.get('/api/icrs/'+icr1._id)
              .expect(200)
              .end(function (icrGetErr, icrGetRes) {
                // Handle icr save error
                if (icrGetErr) {
                  return done(icrGetErr);
                }
                // Get icrs list
                var icr = icrGetRes.body;

                // Set assertions
                (icr.message).should.equal(icr1.message);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to get the icr which is not under his partnership if signed in with partner', function (done) {
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
            // Get a list of icrs
            agent.get('/api/icrs/'+icr2._id)
              .expect(403)
              .end(function (icrsGetErr, icrsGetRes) {                
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.icr.list, 'partner')){
    it('should be able to list the icrs under his partnership if signed in with partner', function (done) {
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
            // Get a list of icrs
            agent.get('/api/icrs')
              .expect(200)
              .end(function (icrsGetErr, icrsGetRes) {
                // Handle icr save error
                if (icrsGetErr) {
                  return done(icrsGetErr);
                }
                // Get icrs list
                var icrs = icrsGetRes.body;

                // Set assertions
                (icrs[0].message).should.equal('test message');
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to list the icrs which are not under his partnership if signed in with partner', function (done) {
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
            // Get a list of icrs
            agent.get('/api/icrs')
              .expect(200)
              .end(function (icrsGetErr, icrsGetRes) {
                // Handle icr save error
                if (icrsGetErr) {
                  return done(icrsGetErr);
                }
                // Get icrs list
                var icrs = icrsGetRes.body;
                console.log(icrs.length);

                // Set assertions
                (icrs[0].message).should.not.be.equal(icr2.message);
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.icr.update,'partner')){
    it('should be able to update a icr under his partnership if signed in with partner', function (done) {
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
            icr1.message = "testing1";
            // Get a list of icrs
            agent.put('/api/icrs/'+icr1._id)
              .send(icr1)
              .expect(200)
              .end(function (icrsGetErr, icrsGetRes) {
                // Handle icr save error
                if (icrsGetErr) {
                  return done(icrsGetErr);
                }
                // Get icrs list
                var icrs = icrsGetRes.body;

                // Set assertions
                (icrs.message).should.match('testing1');

                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to update a icr not under his partnership if signed in with partner', function (done) {
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
            icr2.message = "testing1";
            // Get a list of icrs
            agent.put('/api/icrs/'+icr2._id)
              .send(icr2)
              .expect(403)
              .end(function (icrsGetErr, icrsGetRes) {
                // Handle icr save error
                if (icrsGetErr) {
                  return done(icrsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.icr.delete,'partner')){
    it('should be able to delete a ICR under his partnership if signed in with partner', function (done) {
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
            // Get a list of icrs
            agent.delete('/api/icrs/'+icr1._id)
              .expect(200)
              .end(function (icrsGetErr, icrsGetRes) {
                // Handle icr save error
                if (icrsGetErr) {
                  return done(icrsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to delete a icr not under his partnership if signed in with partner', function (done) {
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
            // Get a list of icrs
            agent.put('/api/icrs/'+icr2._id)
              .expect(403)
              .end(function (icrsGetErr, icrsGetRes) {
                // Handle icr save error
                if (icrsGetErr) {
                  return done(icrsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

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
