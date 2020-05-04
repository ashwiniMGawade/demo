'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  Subtenant = mongoose.model('Subtenant'),
  Site = mongoose.model('Site'),
  Subscription = mongoose.model('Subscription'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, rootCredentials, rootUser, partnerCredentials, partnerUser, readCredentials, readUser;
var partnerTenant, tenant1, tenant2, tenant3, tenant, subtenant, subscription, site;

/**
 * Tenant routes tests
 */
describe('Tenant CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);
    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    rootCredentials = {
      username: 'root',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    rootUser = new User({
      firstName: 'DFAAS',
      lastName: 'Tester',
      displayName: 'DFAAS Tester',
      email: 'dfaastest@test.com',
      username: rootCredentials.username,
      password: rootCredentials.password,
      provider:'local',
      roles: ['root']
    });

    partnerCredentials = {
      username: 'partner',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    partnerUser = new User({
      firstName: 'DFAAS',
      lastName: 'Partner',
      displayName: 'DFAAS Tester',
      email: 'dfaaspartner@test.com',
      username: partnerCredentials.username,
      password: partnerCredentials.password,
      provider:'local',
      roles: ['partner']
    });

    readCredentials = {
      username: 'read',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    readUser = new User({
      firstName: 'DFAAS',
      lastName: 'Read',
      displayName: 'DFAAS Tester',
      email: 'dfaasreadr@test.com',
      username: readCredentials.username,
      password: readCredentials.password,
      provider:'local',
      roles: ['read']
    });

    partnerTenant = new Tenant({
      name: 'Partner tenant',
      code: 'part',
      annotation: 'part'
    });

    tenant1 = new Tenant({
      name: 'Test Tenant1',
      code: 'test1',
      annotation: 'test1'
    });

    tenant2 = new Tenant({
      name: 'Test Tenant2',
      code: 'test2',
      annotation: 'test2'
    });

    tenant3 = new Tenant({
      name: 'Test Tenant3',
      code: 'test3',
      annotation: 'test3'
    });

    rootUser.save(function(){
      partnerTenant.save(function(){
        partnerUser.tenant = partnerTenant;
        partnerUser.save(function(){
          tenant1.partner = partnerTenant;
          tenant1.save(function(){
            tenant2.partner = partnerTenant;
            tenant2.save(function(){
              tenant3.save(function(){ //No partner attached
                readUser.tenant = tenant3;
                readUser.save(function(){
                  tenant = {
                    name: 'Test Tenant',
                    code: 'test'
                  };
                  //initialize annotation when setting is enabled
                  if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
                    tenant.annotation = 'test';
                  }
                  subtenant = new Subtenant({
                    name: 'Subtenant Name',
                    code: 'testsub1'
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
                  site = new Site({
                    name: 'Test Site',
                    code: 'tst'
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

  it('should be able to save a tenant if logged in as root', function (done) {
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (tenantSaveErr, tenantSaveRes) {
            // Handle tenant save error
            if (tenantSaveErr) {
              return done(tenantSaveErr);
            }
            // Get a list of tenants
            agent.get('/api/tenants')
              .end(function (tenantsGetErr, tenantsGetRes) {
                // Handle tenant save error
                if (tenantsGetErr) {
                  return done(tenantsGetErr);
                }
                // Get tenants list
                var tenants = tenantsGetRes.body;
                // Set assertions
                (tenants[4].name).should.match('Test Tenant');
                done();
              });
          });
      });
  });

  it('should not be able to save a tenant if logged in as read', function (done) {
    agent.post('/api/auth/signin')
      .send(readCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .set('Accept', 'application/json')
          .expect(401)
          .end(function (tenantSaveErr, tenantSaveRes) {
            done();
          });
      });
  });

  it('should be able to list tenants under his tenancy if logged in as read', function (done) {
    agent.post('/api/auth/signin')
      .send(readCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new tenant
        agent.get('/api/tenants')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (tenantsGetErr, tenantsGetRes) {
            // Handle tenant save error
            if (tenantsGetErr) {
              return done(tenantsGetErr);
            }
            // Get tenants list
            var tenants = tenantsGetRes.body;
            // Set assertions
            (tenants[0].name).should.match('Test Tenant3');
            // Call the assertion callback
            done();
          });
      });
  });

  it('should not be able to save an tenant if not logged in', function (done) {
    agent.post('/api/tenants')
      .send(tenant)
      .expect(401)
      .end(function (tenantSaveErr, tenantSaveRes) {
        // Call the assertion callback
        done(tenantSaveErr);
      });
  });

  it('should not be able to save an tenant if no Tenant name is provided', function (done) {
    // Invalidate Tenant name field
    tenant.name = '';
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .expect(400)
          .end(function (tenantSaveErr, tenantSaveRes) {
            // Set message assertion
            (tenantSaveRes.body.message).should.match('Tenant name required');
            // Handle tenant save error
            done(tenantSaveErr);
          });
      });
  });

  it('should be able to get the list of tenant if the user is root', function (done) {
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Get a list of tenants
        agent.get('/api/tenants')
          .end(function (tenantsGetErr, tenantsGetRes) {
            // Handle tenant save error
            if (tenantsGetErr) {
              return done(tenantsGetErr);
            }
            // Get tenants list
            var tenants = tenantsGetRes.body;
            // Set assertions
            (tenants.length).should.match(4); //All tenants listed
            (tenants[3].name).should.match('Test Tenant3');
            // Call the assertion callback
            done();
          });
      });
  });

  it('should only be able to list tenants under his partnership if the user is partner', function (done) {
    agent.post('/api/auth/signin')
      .send(partnerCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Get a list of tenants
        agent.get('/api/tenants')
          .expect(200)
          .end(function (tenantsGetErr, tenantsGetRes) {
            // Handle tenant save error
            if (tenantsGetErr) {
              return done(tenantsGetErr);
            }
            // Get tenants list
            var tenants = tenantsGetRes.body;
            // Set assertions
            (tenants.length).should.match(3); //Only tenants in his partnership
            (tenants[1].name).should.match('Test Tenant1');
            (tenants[2].name).should.match('Test Tenant2');
            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to update a tenant under his partnership if the user is partner', function (done) {
    agent.post('/api/auth/signin')
      .send(partnerCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        tenant1.name = "happ1";
        // Get a list of tenants
        agent.put('/api/tenants/'+tenant1._id)
          .send(tenant1)
          .expect(200)
          .end(function (tenantsGetErr, tenantsGetRes) {
            // Handle tenant save error
            if (tenantsGetErr) {
              return done(tenantsGetErr);
            }
            // Get tenants list
            var tenants = tenantsGetRes.body;
            // Set assertions
            (tenants.name).should.match('happ1');
            // Call the assertion callback
            done();
          });
      });
  });

  it('should not be able to update a tenant not under his partnership if the user is partner', function (done) {
    agent.post('/api/auth/signin')
      .send(partnerCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        tenant3.name = "happ1";
        // Get a list of tenants
        agent.put('/api/tenants/'+tenant3._id)
          .send(tenant3)
          .expect(403)
          .end(function (tenantsGetErr, tenantsGetRes) {
            // Handle tenant save error
            if (tenantsGetErr) {
              return done(tenantsGetErr);
            }
            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to delete a tenant under his partnership if the user is partner', function (done) {
    agent.post('/api/auth/signin')
      .send(partnerCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Get a list of tenants
        agent.delete('/api/tenants/'+tenant1._id)
          .expect(200)
          .end(function (tenantsGetErr, tenantsGetRes) {
            // Handle tenant save error
            if (tenantsGetErr) {
              return done(tenantsGetErr);
            }
            // Call the assertion callback
            done();
          });
      });
  });

  it('should not be able to delete a tenant not under his partnership if the user is partner', function (done) {
    agent.post('/api/auth/signin')
      .send(partnerCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Get a list of tenants
        agent.delete('/api/tenants/'+tenant3._id)
          .expect(403)
          .end(function (tenantsGetErr, tenantsGetRes) {
            // Handle tenant save error
            if (tenantsGetErr) {
              return done(tenantsGetErr);
            }
            // Call the assertion callback
            done();
          });
      });
  });

  it('should not be able to save an tenant if no Tenant code is provided', function (done) {
    // Invalidate Tenant code field
    tenant.code = '';

    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .expect(400)
          .end(function (tenantSaveErr, tenantSaveRes) {
            // Set message assertion
            (tenantSaveRes.body.message).should.match('Tenant code required');

            // Handle tenant save error
            done(tenantSaveErr);
          });
      });
  });

  it('should be able to update a tenant if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .expect(200)
          .end(function (tenantSaveErr, tenantSaveRes) {
            // Handle tenant save error
            if (tenantSaveErr) {
              return done(tenantSaveErr);
            }

            // Update tenant title
            tenant.name = 'Test Tenant Changed';

            // Update an existing tenant
            agent.put('/api/tenants/' + tenantSaveRes.body.tenantId)
              .send(tenant)
              .expect(200)
              .end(function (tenantUpdateErr, tenantUpdateRes) {
                // Handle tenant update error
                if (tenantUpdateErr) {
                  return done(tenantUpdateErr);
                }
                // Set assertions
                (tenantUpdateRes.body.name).should.match('Test Tenant Changed');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to delete an tenant if signed in, and no dependancy ', function (done) {
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .expect(200)
          .end(function (tenantSaveErr, tenantSaveRes) {
            // Handle tenant save error
            if (tenantSaveErr) {
              return done(tenantSaveErr);
            }

            //delete default subtenant assigned to tenant
            Subtenant.find({ 'tenant' : tenantSaveRes.body.tenantId })
            .exec(function (err, subtenants) {
              should.not.exist(err);
              subtenants[0].remove();

              //delete the tenant itself
              agent.delete('/api/tenants/' + tenantSaveRes.body.tenantId)
              .expect(200)
              .end(function (tenantDeleteErr, tenantDeleteRes) {
                // Handle tenant error error
                if (tenantDeleteErr) {
                  return done(tenantDeleteErr);
                }
                agent.get('/api/tenants/' + tenantSaveRes.body.tenantId)
                .expect(400)
                .end(function(getErr, getRes) {
                  done();
                });
              });
            });
          });
      });
  });

  it('should be able to delete an tenant if signed in, and no dependancy and logged in with partner', function (done) {
    agent.post('/api/auth/signin')
    .send(partnerCredentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save a new tenant
      agent.post('/api/tenants')
        .send(tenant)
        .expect(200)
        .end(function (tenantSaveErr, tenantSaveRes) {
          // Handle tenant save error
          if (tenantSaveErr) {
            return done(tenantSaveErr);
          }

          //delete default subtenant assigned to tenant
          Subtenant.find({ 'tenant' : tenantSaveRes.body.tenantId })
          .exec(function (err, subtenants) {
            should.not.exist(err);
            subtenants[0].remove();

            //delete the tenant itself
            agent.delete('/api/tenants/' + tenantSaveRes.body.tenantId)
            .expect(200)
            .end(function (tenantDeleteErr, tenantDeleteRes) {
              // Handle tenant error error
              if (tenantDeleteErr) {
                return done(tenantDeleteErr);
              }
              agent.get('/api/tenants/' + tenantSaveRes.body.tenantId)
              .expect(400)
              .end(function(getErr, getRes) {
                done();
              });
            });
          });
        });
     });
  });

  it('should not be able to delete an tenant if signed in, with tenant dependancy ', function (done) {
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
          // Trying to delete the partnerTenant who is linked with a user
          agent.delete('/api/tenants/' + partnerTenant._id)
            .send(tenant)
            .expect(400)
            .end(function (tenantDeleteErr, tenantDeleteRes) {
              // Handle tenant error error
              if (tenantDeleteErr) {
                return done(tenantDeleteErr);
              }

              // Set message assertion
              (tenantDeleteRes.body.message).should.match('Can\'t perform Delete: Please ensure all associated tenants are deleted');

              // Call the assertion callback
              done();
          });
      });
  });

  it('should not be able to delete an tenant if signed in, with subtenant dependancy ', function (done) {
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .expect(200)
          .end(function (tenantSaveErr, tenantSaveRes) {
            // Handle tenant save error
            if (tenantSaveErr) {
              return done(tenantSaveErr);
            }

          subtenant.tenant = mongoose.Types.ObjectId(tenantSaveRes.body.tenantId);

            //associate subtenant with this tenant
            subtenant.save(function(err) {
              should.not.exist(err);

              // Delete an existing tenant
              agent.delete('/api/tenants/' + tenantSaveRes.body.tenantId)
                .send(tenant)
                .expect(400)
                .end(function (tenantDeleteErr, tenantDeleteRes) {
                  // Handle tenant error error
                  if (tenantDeleteErr) {
                    return done(tenantDeleteErr);
                  }

                  // Set message assertion
                  (tenantDeleteRes.body.message).should.match('Can\'t perform Delete: Please ensure all associated subtenants are deleted');
                  subtenant.remove(function() {
                     done();
                  });
                  // Call the assertion callback

                });
            });
          });
      });
  });

  it('should not be able to delete an tenant if signed in, with subscription dependancy ', function (done) {
    agent.post('/api/auth/signin')
      .send(rootCredentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new tenant
        agent.post('/api/tenants')
          .send(tenant)
          .expect(200)
          .end(function (tenantSaveErr, tenantSaveRes) {
            // Handle tenant save error
            if (tenantSaveErr) {
              return done(tenantSaveErr);
            }

            //associate subscription with this tenant
            site.save(function(err) {
              should.not.exist(err);
              subscription.site = site;
              subscription.tenant = mongoose.Types.ObjectId(tenantSaveRes.body.tenantId);
              subscription.save(function(err) {
                should.not.exist(err);
                // Delete an existing tenant
                agent.delete('/api/tenants/' + tenantSaveRes.body.tenantId)
                  .send(tenant)
                  .expect(400)
                  .end(function (tenantDeleteErr, tenantDeleteRes) {
                    // Handle tenant error error
                    if (tenantDeleteErr) {
                      return done(tenantDeleteErr);
                    }

                    // Set message assertion
                    (tenantDeleteRes.body.message).should.match('Can\'t perform Delete: Please ensure all associated subscriptions are deleted!');
                    subscription.remove(function() {
                       done();
                    });
                  });
              });
            });
          });
      });
  });


  it('should not be able to delete an tenant if not signed in', function (done) {
    // Delete an existing tenant
    agent.delete('/api/tenants/' + tenant2._id)
      .send(tenant)
      .expect(401)
      .end(function (tenantDeleteErr, tenantDeleteRes) {
        // Handle tenant error error
        if (tenantDeleteErr) {
          return done(tenantDeleteErr);
        }
        done();
      });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      subtenant.remove();
      Tenant.remove().exec(done);
    });
  });
});
