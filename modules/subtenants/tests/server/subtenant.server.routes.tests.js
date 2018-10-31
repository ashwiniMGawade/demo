'use strict';

var _ = require('lodash'),
  should = require('should'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  Server = mongoose.model('Server'),
  Subscription = mongoose.model('Subscription'),
  Site = mongoose.model('Site'),
  Subtenant = mongoose.model('Subtenant'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, subscription, site, userRead, credentialsRead;
var partnerTenant, tenant1, tenant2, subtenant, subtenant1, subtenant2;

/**
 * Subtenant routes tests
 */
describe('Subtenant CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'dfaastester',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    credentialsRead = {
      username: 'readuser',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'DFAAS',
      lastName: 'Tester',
      displayName: 'DFAAS Tester',
      email: 'dfaastester@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      roles:['root']
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
      code:'tenant1',
      name:'testTenant1'
    });

    tenant2 = new Tenant({
      code:'tenant2',
      name:'testTenant2'
    });

    subtenant1 = new Subtenant({
      code: 'subcode1',
      name: 'subtenant1'
    });

    subtenant2 = new Subtenant({
      code: 'subcode2',
      name: 'subtenant2'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant1.annotation = 'test';
      tenant2.annotation = 'test';
      partnerTenant.annotation = 'test';
    }

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

   
    partnerTenant.save(function(err){
      should.not.exist(err);
      tenant1.partner = partnerTenant;
      tenant1.save(function(err){
        should.not.exist(err);
        tenant2.save(function(err){
          should.not.exist(err);
          user.tenant = tenant1;
           user.save(function(err){
            should.not.exist(err);
            userRead.tenant = tenant1;
            userRead.save(function(err) {
              should.not.exist(err);
              subtenant1.tenant = tenant1;
              subtenant1.partner = partnerTenant;
              subtenant1.save(function(err){
                should.not.exist(err);
                subtenant2.tenant = tenant2;
                subtenant2.save(function(err){
                  should.not.exist(err);
                  site.save(function(err){
                    should.not.exist(err);
                    subscription.site = site;
                    subscription.tenant = tenant1;
                    subscription.save(function(err) {
                      should.not.exist(err);
                      subtenant = {
                        name: 'Subtenant Name',
                        code: 'testsub1',
                        tenantId:tenant1._id
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

  it('should not be able to save an subtenant if not logged in', function (done) {
    agent.post('/api/subtenants')
      .send(subtenant)
      .expect(401)
      .end(function (subtenantSaveErr, subtenantSaveRes) {
        // Call the assertion callback
        done(subtenantSaveErr);
      });

  });

  it('should not be able to save an subtenant if logged in and but not authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save a new subtenant
      agent.post('/api/subtenants')
        .send(subtenant)
        .expect(403)
        .end(function (subtenantSaveErr, subtenantSaveRes) {
          // Handle subtenant save error
          if (subtenantSaveErr) {
            return done(subtenantSaveErr);
          }
          done(subtenantSaveErr);
    });
  });
  });

  it('should be able to save an subtenant if logged in and authorized user (root)', function (done) {
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

        // Save a new subtenant
        agent.post('/api/subtenants')
          .send(subtenant)
          .expect(200)
          .end(function (subtenantSaveErr, subtenantSaveRes) {
            // Handle subtenant save error
            if (subtenantSaveErr) {
              return done(subtenantSaveErr);
            }

            // Set assertions
            (subtenantSaveRes.body.code).should.equal('testsub1');
            (subtenantSaveRes.body.name).should.match('Subtenant Name');

            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to save an subtenant if logged in and authorized user (root)', function (done) {
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

        // Save a new subtenant
        agent.post('/api/subtenants')
          .send(subtenant)
          .expect(200)
          .end(function (subtenantSaveErr, subtenantSaveRes) {
            // Handle subtenant save error
            if (subtenantSaveErr) {
              return done(subtenantSaveErr);
            }

            // Set assertions
            (subtenantSaveRes.body.code).should.equal('testsub1');
            (subtenantSaveRes.body.name).should.match('Subtenant Name');

            // Call the assertion callback
            done();
          });
      });
  });



  it('should not be able to save an subtenant if no name is provided', function (done) {
    // Invalidate name field
    subtenant.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new subtenant
        agent.post('/api/subtenants')
          .send(subtenant)
          .expect(400)
          .end(function (subtenantSaveErr, subtenantSaveRes) {
            // Set message assertion
            (subtenantSaveRes.body.message).should.match('Subtenant name required');
            // Handle subtenant save error
            done(subtenantSaveErr);
          });
      });
  });

  it('should be able to update an subtenant if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new subtenant
        agent.post('/api/subtenants')
          .send(subtenant)
          .expect(200)
          .end(function (subtenantSaveErr, subtenantSaveRes) {
            // Handle subtenant save error
            if (subtenantSaveErr) {
              return done(subtenantSaveErr);
            }

            // Update subtenant name
            subtenant.name = 'Updated Subtenant Name';

            // Update an existing subtenant
            agent.put('/api/subtenants/' + subtenantSaveRes.body.subtenantId)
              .send(subtenant)
              .expect(200)
              .end(function (subtenantUpdateErr, subtenantUpdateRes) {
                // Handle subtenant update error
                if (subtenantUpdateErr) {
                  return done(subtenantUpdateErr);
                }

                // Set assertions
                (subtenantUpdateRes.body.subtenantId).should.equal(subtenantSaveRes.body.subtenantId);
                (subtenantUpdateRes.body.name).should.match('Updated Subtenant Name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to get a list of subtenants if not signed in', function (done) {
    // Create new subtenant model instance
    var subtenantObj = new Subtenant(subtenant);

    // Save the subtenant
    subtenantObj.save(function () {
      // Request subtenants
      request(app).get('/api/subtenants')
        .expect(401)
        .end(function (err, res) {
          // Call the assertion callback
          done(err);
        });

    });
  });

  it('should be able to get a list of subtenants if signed in with root', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

      // Create new subtenant model instance
      var subtenantObj = new Subtenant(subtenant);

      // Save the subtenant
      subtenantObj.save(function () {
        // Request subtenants
        agent.get('/api/subtenants')
          .expect(200)
          .end(function (err, res) {
            // Call the assertion callback
            (res.body.length).should.be.above(0);
            done();
          });
      });
    });
  });

  it('should be able to get a list of subtenants if signed in with admin', function (done) {
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

        // Create new subtenant model instance
        var subtenantObj = new Subtenant(subtenant);

        // Save the subtenant
        subtenantObj.save(function () {
          // Request subtenants
          agent.get('/api/subtenants')
            .expect(200)
            .end(function (err, res) {
              // Call the assertion callback
              (res.body.length).should.be.above(0);
              done();
            });
        });
      });
    });    
  });


  it('should be able to get an subtenant if signed in and authorized root user', function (done) {
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

        // Save a new subtenant
        agent.post('/api/subtenants')
          .send(subtenant)
          .expect(200)
          .end(function (subtenantSaveErr, subtenantSaveRes) {
            // Handle subtenant save error
            if (subtenantSaveErr) {
              return done(subtenantSaveErr);
            }
            // Update an existing subtenant
            agent.get('/api/subtenants/' + subtenantSaveRes.body.subtenantId)
              .send(subtenant)
              //.expect(200)
              .end(function (subtenantErr, subtenantRes) {
                // Handle subtenant update error
                if (subtenantErr) {
                  return done(subtenantErr);
                }

                // Set assertions
                (subtenantSaveRes.body.subtenantId).should.equal(subtenantRes.body.subtenantId);
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should return proper error for single subtenant with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/subtenants/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Subtenant is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single subtenant which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent subtenant
    request(app).get('/api/subtenants/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No subtenant with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an subtenant if signed in', function (done) {
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

        // Save a new subtenant
        agent.post('/api/subtenants')
          .send(subtenant)
          .expect(200)
          .end(function (subtenantSaveErr, subtenantSaveRes) {
            // Handle subtenant save error
            if (subtenantSaveErr) {
              return done(subtenantSaveErr);
            }

            // Delete an existing subtenant
            agent.delete('/api/subtenants/' + subtenantSaveRes.body.subtenantId)
              .send(subtenant)
              .expect(200)
              .end(function (subtenantDeleteErr, subtenantDeleteRes) {
                // Handle subtenant error error
                if (subtenantDeleteErr) {
                  return done(subtenantDeleteErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an subtenant if signed in, but vFASS dependancy is present', function (done) {
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

        // Save a new subtenant
        agent.post('/api/subtenants')
          .send(subtenant)
          .expect(200)
          .end(function (subtenantSaveErr, subtenantSaveRes) {
            // Handle subtenant save error
            if (subtenantSaveErr) {
              return done(subtenantSaveErr);
            }
            var server = new Server ({
              site: mongoose.Types.ObjectId(site._id),
              subtenant:  mongoose.Types.ObjectId(subtenantSaveRes.body.subtenantId),
              name: 'Test Server',
              subnet: '10.20.30.64/26',
              managed: 'Portal',
              subscription:subscription
            });

            server.save(function(err){
              should.not.exists(err);
              // Delete an existing subtenant
              agent.delete('/api/subtenants/' + subtenantSaveRes.body.subtenantId)
                .send(subtenant)
                .expect(400)
                .end(function (subtenantDeleteErr, subtenantDeleteRes) {
                  // Handle subtenant error error
                  if (subtenantDeleteErr) {
                    return done(subtenantDeleteErr);
                  }
                  server.remove();
                  // Set assertions
                  (subtenantDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated vFASs are deleted');

                  // Call the assertion callback
                  done();
                });
            });
          });
      });
  });

  if(_.includes(featuresSettings.roles.subtenant.list,'partner')){
    it('should be able to list the subtenant under his partnership if signed in with partner', function (done) {
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
            // Get a list of subtenants
            agent.get('/api/subtenants')
              .expect(200)
              .end(function (subtenantsGetErr, subtenantsGetRes) {
                // Handle subtenant save error
                if (subtenantsGetErr) {
                  return done(subtenantsGetErr);
                }
                // Get subtenants list
                var subtenants = subtenantsGetRes.body;

                // Set assertions
                (subtenants[0].code).should.equal('subcode1');
                (subtenants[0].name).should.match('subtenant1');

                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.subtenant.update,'partner')){
    it('should be able to update a subtenant under his partnership if signed in with partner', function (done) {
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
            subtenant1.name = "testing1";
            // Get a list of subtenants
            agent.put('/api/subtenants/'+subtenant1._id)
              .send(subtenant1)
              .expect(200)
              .end(function (subtenantsGetErr, subtenantsGetRes) {
                // Handle subtenant save error
                if (subtenantsGetErr) {
                  return done(subtenantsGetErr);
                }
                // Get subtenants list
                var subtenants = subtenantsGetRes.body;

                // Set assertions
                (subtenants.name).should.match('testing1');

                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to update a subtenant not under his partnership if signed in with partner', function (done) {
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
            subtenant2.name = "testing1";
            // Get a list of subtenants
            agent.put('/api/subtenants/'+subtenant2._id)
              .send(subtenant2)
              .expect(403)
              .end(function (subtenantsGetErr, subtenantsGetRes) {
                // Handle subtenant save error
                if (subtenantsGetErr) {
                  return done(subtenantsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.subtenant.delete,'partner')){
    it('should be able to delete a subtenant under his partnership if signed in with partner', function (done) {
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
            // Get a list of subtenants
            agent.delete('/api/subtenants/'+subtenant1._id)
              .expect(200)
              .end(function (subtenantsGetErr, subtenantsGetRes) {
                // Handle subtenant save error
                if (subtenantsGetErr) {
                  return done(subtenantsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to delete a subtenant not under his partnership if signed in with partner', function (done) {
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
            // Get a list of subtenants
            agent.put('/api/subtenants/'+subtenant2._id)
              .expect(403)
              .end(function (subtenantsGetErr, subtenantsGetRes) {
                // Handle subtenant save error
                if (subtenantsGetErr) {
                  return done(subtenantsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  it('should not be able to delete an subtenant if not signed in', function (done) {
    // Set subtenant user
    subtenant1.user = user;

    // Create new subtenant model instance
    var subtenantObj = new Subtenant(subtenant1);

    // Save the subtenant
    subtenantObj.save(function () {
      // Try deleting subtenant
      request(app).delete('/api/subtenants/' + subtenantObj._id)
        .expect(401)
        .end(function (subtenantDeleteErr, subtenantDeleteRes) {
          // Set message assertion
          // (subtenantDeleteRes.body.message).should.match('Session has expired, please login again to access the resource');

          // Handle subtenant error error
          done(subtenantDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Tenant.remove().exec(function() {
        Site.remove().exec(function() {
          Subscription.remove().exec(function() {
            Subtenant.remove().exec(function() {
              done();
            });
          });
        });
      });
    });
  });

});
