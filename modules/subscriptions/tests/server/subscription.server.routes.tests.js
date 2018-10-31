'use strict';

var should = require('should'),
 _ = require('lodash'),
request = require('supertest'),
path = require('path'),
featuresSettings = require(path.resolve('./config/features')),
mongoose = require('mongoose'),
User = mongoose.model('User'),
Site = mongoose.model('Site'),
Pod = mongoose.model('Pod'),
Server = mongoose.model('Server'),
Tenant = mongoose.model('Tenant'),
Subtenant = mongoose.model('Subtenant'),
Subscription = mongoose.model('Subscription'),
express = require(path.resolve('./config/lib/express'));

/**
* Globals
*/
var app, agent, credentials, user, site, credentialsRead, userRead, pod;
var subscription1, subscription2, subscription, tenant1, tenant2, subtenant1, server1, partnerTenant, server;

/**
* Subscription routes tests
*/
describe('Subscription CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };
    credentialsRead = {
      username: 'readuser',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'testme@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      roles : ['root']
    });
    userRead = new User({
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin User',
      email: 'adminusertest@test.com',
      username: credentialsRead.username,
      password: credentialsRead.password,
      roles: ['read'],
      provider:'local'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
    });

    pod = new Pod({
      name: 'Test Pod',
      code: 'tpd'
    });

    tenant1 = new Tenant({
      name: 'Test Tenant',
      code: 'ttttt'
    });

    partnerTenant = new Tenant({
      code:'ptc',
      name:'partnerTenant2'
    });

    tenant2 = new Tenant({
      code:'a1453',
      name:'testTenant2'
    });

    subtenant1 = new Subtenant({
      name: 'Test SubTenant',
      code: 'sssss',
    });

    server1 = new Server({
      name: 'Test VFas',     
      managed: 'Portal',
      subnet: '10.23.12.0/26',
      code: 'testVfas',
      status:'Operational',
      nfs:true
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant1.annotation = 'test';
      tenant2.annotation = 'test';
      partnerTenant.annotation = 'test';
    }

    subscription = {
      name: 'Test Subscription',
      code: 'testcode',
      description: 'testdesc',
      url: 'http://test.com'
    };

    subscription1 = new Subscription({
      name: 'test subscription one',
      code: 'testsub',
      url: 'http://test.com',
      description: 'this is the test subscription'
    });

    subscription2 = new Subscription({
      name: 'test subscription two',
      code: 'testsubtwo',
      url: 'http://test.com',
      description: 'this is the second test subscription'
    });

    //initialize subscription pack when prepaid payment method setting is enabled
    if (featuresSettings.paymentMethod.prePaid) {
      subscription.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
      subscription1.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
      subscription2.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
    }
  
    // Save a user to the test db and create new subscription

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
              subtenant1.tenant = tenant1;  
              subtenant1.save(function (errSubtenant) {
                should.not.exist(errSubtenant);
                server1.subtenant = subtenant1;
                site.save(function(err){
                  should.not.exist(err);  
                  subscription.tenant = tenant1._id;
                  subscription.tenantId = tenant1._id;
                  subscription1.tenant = tenant1._id;
                  subscription2.tenant = tenant2._id;

                  subscription1.partner = partnerTenant;
                  subscription.partner = partnerTenant;

                  subscription.site = subscription1.site = subscription2.site = site;
                  subscription.siteId = site._id;

                  subscription1.save(function(err) {
                    should.not.exist(err);
                    subscription2.save(function(err) {
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

  //////////////////////////// create //////////////////////////////////////

  it('should be able to save an subscription if logged in and authorized', function (done) {

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
        // Save a new subscription
        agent.post('/api/subscriptions')
        .send(subscription)
        .expect(200)
        .end(function (subscriptionSaveErr, subscriptionSaveRes) {
          // Handle subscription save error
          if (subscriptionSaveErr) {
            return done();
          }
          // Set assertions
          (subscriptionSaveRes.body.code).should.equal(subscription.code);
          (subscriptionSaveRes.body.name).should.match('Test Subscription');

          // Call the assertion callback
          done();
        });
      });
    });
  });

  it('should not be able to save an subscription if logged in and authorizedbut tenant is blank ', function (done) {

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
        subscription.tenantId = '';
        // Save a new subscription
        agent.post('/api/subscriptions')
        .send(subscription)
        .expect(400)
        .end(function (subscriptionSaveErr, subscriptionSaveRes) {
          // Handle subscription save error
          if (subscriptionSaveErr) {
            return done();
          }
          // // Set assertions
          // (subscriptionSaveRes.body.code).should.equal(subscription.code);
          // (subscriptionSaveRes.body.name).should.match('Test Subscription');

          // Call the assertion callback
          done();
        });
      });
    });
  });

  it('should not be able to save an subscription if logged in but not authorized', function (done) {
    userRead.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
      .send(credentialsRead)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new subscription
        agent.post('/api/subscriptions')
        .send(subscription)
        .expect(403)
        .end(function (subscriptionSaveErr, subscriptionSaveRes) {
          // Handle subscription save error
          if (subscriptionSaveErr) {
            return done(subscriptionSaveErr);
          }
          done(subscriptionSaveErr);
        });
      });
    });
  });

  it('should not be able to save an subscription if not logged in', function (done) {
    agent.post('/api/subscriptions')
    .send(subscription)
    .expect(401)
    .end(function (subscriptionSaveErr, subscriptionSaveRes) {
      // Call the assertion callback
      done(subscriptionSaveErr);
    });
  });

  /////////////////////update ///////////////////////////////////////

  it('should be able to update an subscription if signed in', function (done) {
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
        var subscriptionObj = new Subscription(subscription);

        subscriptionObj.save(function (err) {
          should.not.exist(err);

          // Update subscription name
          subscription.name = 'new name';

          // Update an existaming subscription
          agent.put('/api/subscriptions/' + subscriptionObj._id)
          .send(subscription)
          .expect(200)
          .end(function (subscriptionUpdateErr, subscriptionUpdateRes) {
            // Handle subscription update error
            if (subscriptionUpdateErr) {
              return done(subscriptionUpdateErr);
            }

            // Set assertions
            (subscriptionUpdateRes.body.code).should.match(subscriptionObj.code);
            (subscriptionUpdateRes.body.name).should.match('new name');

            // Call the assertion callback
            done();
          });
        });
      });
    });
  });

  it('should not be able to update an subscription if not signed in', function (done) {
    // Update an existaming subscription
    agent.put('/api/subscriptions/' + subscription1._id)
    .send(subscription)
    .expect(401)
    .end(function (subscriptionUpdateErr, subscriptionUpdateRes) {
      // Call the assertion callback
      done();
    });
  }); 


  //////////////////////// list //////////////////////////////

  it('should not be able to get a list of subscriptions if not signed in', function (done) {
    // Create new subscription model instance
    var subscriptionObj = new Subscription(subscription);

    // Save the subscription
    subscriptionObj.save(function () {
      // Request subscriptions
      agent.get('/api/subscriptions')
      .expect(401)
      .end(function (err, res) {
        done(err);
      });

    });
  });

  it('should be able to get a list of subscriptions if signed in with root user', function (done) {
    // Create new subscription model instance
    var subscriptionObj = new Subscription(subscription);
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
        // Get the userId
        var userId = user.id;
        // Save the subscription
        subscriptionObj.save(function (err) {
          should.not.exist(err);
          // Request subscriptions
          agent.get('/api/subscriptions')
          .expect(200)
          .end(function (err, res) {
            // Set assertion
            res.body.should.be.instanceof(Array).and.have.lengthOf(3);
            // Call the assertion callback
            done();
          });

        });
      });
    });
  });

  it('should be able to get a list of subscriptions if signed in with read user', function (done) {
    // Create new subscription model instance
    var subscriptionObj = new Subscription(subscription);
    userRead.tenant = tenant1._id;
    userRead.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
      .send(credentialsRead)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save the subscription
        subscriptionObj.save(function (err) {
          should.not.exist(err);
          // Request subscriptions
          agent.get('/api/subscriptions')
          .expect(200)
          .end(function (err, res) {
            // Set assertion
            res.body.should.be.instanceof(Array).and.have.lengthOf(2);
            // Call the assertion callback
            done();
          });

        });
      });
    });
  });





  ////////////////////////////// read ////////////////////////////////////


  it('should be able to get a single subscription if signed in', function (done) {
    // Create new subscription model instance
    var subscriptionObj = new Subscription(subscription);

    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save the subscription
      subscriptionObj.save(function () {
        agent.get('/api/subscriptions/' + subscriptionObj._id)
        .end(function (err, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', subscription.name);

          // Call the assertion callback
          done();
        });
      });
    });
  });

  it('should not be able to get a single subscription if signed in but invalid id', function (done) {
    // Create new subscription model instance
    var subscriptionObj = new Subscription(subscription);

    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save the subscription
      subscriptionObj.save(function () {
        agent.get('/api/subscriptions/test')
        .expect(400)
        .end(function (err, res) {
          // Set assertion

          // Call the assertion callback
          done();
        });
      });
    });
  });

  it('should not be able to get a single subscription of another tenant', function (done) {
    // Create new subscription model instance
    var subscriptionObj = new Subscription(subscription);

    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save the subscription
      subscriptionObj.save(function () {
        agent.get('/api/subscriptions/' + subscription2._id)
        .expect(403)
        .end(function (err, res) {
          // Set assertion

          // Call the assertion callback
          done();
        });
      });
    });
  });


  /////////////////////////////// delete ///////////////////////////////////

  it('should be able to delete an subscription if signed in', function (done) {
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

        // Get the userId
        var userId = user.id;

        // Save a new subscription
        agent.post('/api/subscriptions')
        .send(subscription)
        .expect(200)
        .end(function (subscriptionSaveErr, subscriptionSaveRes) {
          // Handle subscription save error
          if (subscriptionSaveErr) {
            return done(subscriptionSaveErr);
          }

          // Delete an existing subscription
          agent.delete('/api/subscriptions/' + subscriptionSaveRes.body.subscriptionId)
          .send(subscription)
          .expect(200)
          .end(function (subscriptionDeleteErr, subscriptionDeleteRes) {
            // Handle subscription error error
            if (subscriptionDeleteErr) {
              return done(subscriptionDeleteErr);
            }
            // Call the assertion callback
            done();
          });
        });
      });
    });
  });

  it('should not be able to delete an subscription if signed in, but has server dependancy, ', function (done) {
    user.roles = ['root'];
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

        // Save a new subscription
        agent.post('/api/subscriptions')
        .send(subscription)
        .expect(200)
        .end(function (subscriptionSaveErr, subscriptionSaveRes) {
          // Handle subscription save error
          if (subscriptionSaveErr) {
            return done(subscriptionSaveErr);
          }
          pod.save(function(err){
            should.not.exists(err);
            server1.subscription = subscriptionSaveRes.body.subscriptionId;
            server1.site = site;
            server1.save(function(err) {
              should.not.exist(err);
              // Delete an existing subscription
              agent.delete('/api/subscriptions/' + subscriptionSaveRes.body.subscriptionId)
              .send(subscription)
              .expect(400)
              .end(function (subscriptionDeleteErr, subscriptionDeleteRes) {
                // Handle subscription error error
                if (subscriptionDeleteErr) {
                  return done(subscriptionDeleteErr);
                }

                // Set assertions
                (subscriptionDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated servers are deleted');
                server1.remove();
                // Call the assertion callback
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should not be able to delete an subscription if not signed in', function (done) {
    // Set subscription user
    subscription.user = user;

    // Create new subscription model instance
    var subscriptionObj = new Subscription(subscription);

    // Save the subscription
    subscriptionObj.save(function () {
      // Try deleting subscription
      request(app).delete('/api/subscriptions/' + subscriptionObj._id)
      .expect(401)
      .end(function (subscriptionDeleteErr, subscriptionDeleteRes) {
        // Set message assertion
        (subscriptionDeleteRes.body.message).should.match('Invalid username/password');

        // Handle subscription error error
        done(subscriptionDeleteErr);
      });

    });
  });

  //////////// feature based test cases/////////////////////////////////////////////

   if(_.includes(featuresSettings.roles.subscription.read, 'partner')){
    it('should be able to get the subscription under his partnership if signed in with partner', function (done) {
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
            // Get a list of subscriptions
            agent.get('/api/subscriptions/'+subscription1._id)
              .expect(200)
              .end(function (subscriptionGetErr, subscriptionGetRes) {
                // Handle subscription save error
                if (subscriptionGetErr) {
                  return done(subscriptionGetErr);
                }
                // Get subscriptions list
                var subscription = subscriptionGetRes.body;

                // Set assertions
                (subscription.name).should.equal(subscription1.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to get the subscription which is not under his partnership if signed in with partner', function (done) {
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
            // Get a list of subscriptions
            agent.get('/api/subscriptions/'+subscription2._id)
              .expect(403)
              .end(function (subscriptionsGetErr, subscriptionsGetRes) {                
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.subscription.list, 'partner')){
    it('should be able to list the subscriptions under his partnership if signed in with partner', function (done) {
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
            // Get a list of subscriptions
            agent.get('/api/subscriptions')
              .expect(200)
              .end(function (subscriptionsGetErr, subscriptionsGetRes) {
                // Handle subscription save error
                if (subscriptionsGetErr) {
                  return done(subscriptionsGetErr);
                }
                // Get subscriptions list
                var subscriptions = subscriptionsGetRes.body;

                // Set assertions
                (subscriptions[0].name).should.equal(subscription1.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to list the subscriptions which are not under his partnership if signed in with partner', function (done) {
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
            // Get a list of subscriptions
            agent.get('/api/subscriptions')
              .expect(200)
              .end(function (subscriptionsGetErr, subscriptionsGetRes) {
                // Handle subscription save error
                if (subscriptionsGetErr) {
                  return done(subscriptionsGetErr);
                }
                // Get subscriptions list
                var subscriptions = subscriptionsGetRes.body;

                // Set assertions
                (subscriptions[0].name).should.not.be.equal(subscription2.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.subscription.update,'partner')){
    it('should be able to update a subscription under his partnership if signed in with partner', function (done) {
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
            subscription1.name = "testing1";
            // Get a list of subscriptions
            agent.put('/api/subscriptions/'+subscription1._id)
              .send(subscription1)
              //.expect(200)
              .end(function (subscriptionsGetErr, subscriptionsGetRes) {
                // Handle subscription save error
                if (subscriptionsGetErr) {
                  return done(subscriptionsGetErr);
                }
                // Get subscriptions list
                var subscriptions = subscriptionsGetRes.body;

                // Set assertions
                (subscriptions.name).should.match('testing1');

                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to update a subscription not under his partnership if signed in with partner', function (done) {
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
            subscription2.name = "testing1";
            // Get a list of subscriptions
            agent.put('/api/subscriptions/'+subscription2._id)
              .send(subscription2)
              .expect(403)
              .end(function (subscriptionsGetErr, subscriptionsGetRes) {
                // Handle subscription save error
                if (subscriptionsGetErr) {
                  return done(subscriptionsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.subscription.delete,'partner')){
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
            // Get a list of subscriptions
            agent.delete('/api/subscriptions/'+subscription1._id)
              .expect(200)
              .end(function (subscriptionsGetErr, subscriptionsGetRes) {
                // Handle subscription save error
                if (subscriptionsGetErr) {
                  return done(subscriptionsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to delete a subscription not under his partnership if signed in with partner', function (done) {
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
            // Get a list of subscriptions
            agent.put('/api/subscriptions/'+subscription2._id)
              .expect(403)
              .end(function (subscriptionsGetErr, subscriptionsGetRes) {
                // Handle subscription save error
                if (subscriptionsGetErr) {
                  return done(subscriptionsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  afterEach(function (done) {
    Subscription.remove().exec(function () {
      User.remove().exec(function() {
        Tenant.remove().exec(function() {
          partnerTenant.remove();
          tenant1.remove();
          tenant2.remove();
          subscription1.remove();
          subscription2.remove(); 
          Site.remove().exec(done);
        });
      });
    });
  });
});
