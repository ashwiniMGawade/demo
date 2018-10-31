'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Site = mongoose.model('Site'),
  Tenant = mongoose.model('Tenant'),
  Subscription = mongoose.model('Subscription'),
  Pod = mongoose.model('Pod'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */

var app, agent, credentials, user, site, credentialsAdmin, userAdmin, tenant, subscription;

/**
 * Site routes tests
 */
describe('Site CRUD tests', function () {

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
    credentialsAdmin = {
      username: 'adminuser',
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

    userAdmin = new User({
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin User',
      email: 'adminusertest@test.com',
      username: credentialsAdmin.username,
      password: credentialsAdmin.password,
      roles: ['admin'],
      provider:'local'
    });

    tenant = new Tenant({
      name: 'Test Tenant',
      code: 'a1234'
    });
    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
    }

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

    // Save a user to the test db and create new site
    tenant.save(function(err) {
      should.not.exist(err);
      userAdmin.tenant = tenant;
      userAdmin.save(function (err) {
        should.not.exist(err);
        user.save(function (err) {
          tenant.save(function(err) {
            should.not.exist(err);
            site = {
              name: 'Site name',
              code: 'site',
              user: mongoose.Types.ObjectId(user._id)
            };
            done();
          });
        });
      });
    });

  });

  it('should be able to save an site if logged in and authorized', function (done) {

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
          // Save a new site
          agent.post('/api/sites')
            .send(site)
            .expect(200)
            .end(function (siteSaveErr, siteSaveRes) {
              // Handle site save error
              if (siteSaveErr) {
                return done(siteSaveRes.body);
              }
              // Set assertions
              (siteSaveRes.body.code).should.equal(site.code);
              (siteSaveRes.body.name).should.match('Site name');

              // Call the assertion callback
              done();
            });
        });
    });
  });

  it('should be able to save an site if logged in but not authorized', function (done) {

    userAdmin.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsAdmin)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new site
          agent.post('/api/sites')
            .send(site)
            .expect(403)
            .end(function (siteSaveErr, siteSaveRes) {
              // Handle site save error
              if (siteSaveErr) {
                return done(siteSaveErr);
              }
              done(siteSaveErr);
            });
        });
    });
  });

  it('should not be able to save an site if not logged in', function (done) {
    agent.post('/api/sites')
      .send(site)
      .expect(401)
      .end(function (siteSaveErr, siteSaveRes) {
        // Call the assertion callback
        done(siteSaveErr);
      });
  });

  it('should not be able to save an site if no name is provided', function (done) {
    // Invalidate title field
    site.name = '';

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

          // Get the userId
          var userId = user.id;

          // Save a new site
          agent.post('/api/sites')
            .send(site)
            .expect(400)
            .end(function (siteSaveErr, siteSaveRes) {
              // Set message assertion
              (siteSaveRes.body.message).should.match('Site name required');

              // Handle site save error
              done(siteSaveErr);
            });
        });
    });
  });

  it('should be able to update an site if signed in', function (done) {
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

          // Get the userId
          var userId = user.id;

          // Save a new site
          agent.post('/api/sites')
            .send(site)
            .expect(200)
            .end(function (siteSaveErr, siteSaveRes) {
              // Handle site save error
              if (siteSaveErr) {
                return done(siteSaveErr);
              }

              // Update site title
              site.name = 'WHY YOU GOTTA BE SO MEAN';

              // Update an existaming site
              agent.put('/api/sites/' + siteSaveRes.body.siteId)
                .send(site)
                .expect(200)
                .end(function (siteUpdateErr, siteUpdateRes) {
                  // Handle site update error
                  if (siteUpdateErr) {
                    return done(siteUpdateErr);
                  }

                  // Set assertions
                  (siteUpdateRes.body.siteId).should.equal(siteSaveRes.body.siteId);
                  (siteUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN');

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should not be able to get a list of sites if not signed in', function (done) {
    // Create new site model instance
    var siteObj = new Site(site);

    // Save the site
    siteObj.save(function () {
      // Request sites
      request(app).get('/api/sites')
        .expect(401)
        .end(function (err, res) {
          // Set assertion
          //res.body.should.be.instanceof(Array).and.have.lengthOf(1);
          // Call the assertion callback
          done(err);
        });

    });
  });

  it('should be able to get a list of sites if signed in', function (done) {
    // Create new site model instance
    var siteObj = new Site(site);

    userAdmin.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsAdmin)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }
          // Get the userId
          var userId = user.id;
          // Save the site
          siteObj.save(function (err) {
            should.not.exist(err);
            // Request sites
            agent.get('/api/sites')
              .expect(200)
              .end(function (err, res) {
                // Set assertion
                res.body.should.be.instanceof(Array).and.have.lengthOf(1);
                // Call the assertion callback
                done();
              });

          });
        });
    });
  });

  it('should be able to get a single site if signed in', function (done) {
    // Create new site model instance
    var siteObj = new Site(site);

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save the site
        siteObj.save(function () {
          agent.get('/api/sites/' + siteObj._id)
            .end(function (err, res) {
              // Set assertion
              res.body.should.be.instanceof(Object).and.have.property('name', site.name);

              // Call the assertion callback
              done();
            });
        });
      });
  });

  it('should return proper error for single site with an invalid Id, if signed in', function (done) {
    // test is not a valid mongoose Id
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        agent.get('/api/sites/test')
          .expect(400)
          .end(function (req, res) {
            // Set assertion
            res.body.should.be.instanceof(Object).and.have.property('message', 'Site is invalid');

            // Call the assertion callback
            done();
          });
      });
  });

  it('should return proper error for single site which doesnt exist, if signed in', function (done) {
    // This is a valid mongoose Id but a non-existent site
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        agent.get('/api/sites/559e9cd815f80b4c256a8f41')
          .expect(400)
          .end(function (req, res) {
            // Set assertion
            res.body.should.be.instanceof(Object).and.have.property('message', 'No site with that identifier has been found');

            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to delete an site if signed in', function (done) {
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

          // Get the userId
          var userId = user.id;

          // Save a new site
          agent.post('/api/sites')
            .send(site)
            .expect(200)
            .end(function (siteSaveErr, siteSaveRes) {
              // Handle site save error
              if (siteSaveErr) {
                return done(siteSaveErr);
              }

              // Delete an existing site
              agent.delete('/api/sites/' + siteSaveRes.body.siteId)
                .send(site)
                .expect(200)
                .end(function (siteDeleteErr, siteDeleteRes) {
                  // Handle site error error
                  if (siteDeleteErr) {
                    return done(siteDeleteErr);
                  }
                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should not be able to delete an site if signed in, but has pod dependancy, ', function (done) {
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

          // Save a new site
          agent.post('/api/sites')
            .send(site)
            .expect(200)
            .end(function (siteSaveErr, siteSaveRes) {
              // Handle site save error
              if (siteSaveErr) {
                return done(siteSaveErr);
              }

              var pod = new Pod({
                name: 'Pod name',
                code: 'testpod',
                site: mongoose.Types.ObjectId(siteSaveRes.body.siteId),
                vlansAvailable: 12,
                user: mongoose.Types.ObjectId(user._id)
              });

              pod.save(function(err){
                should.not.exists(err);
                // Delete an existing site
                agent.delete('/api/sites/' + siteSaveRes.body.siteId)
                  .send(site)
                  .expect(400)
                  .end(function (siteDeleteErr, siteDeleteRes) {
                    // Handle site error error
                    if (siteDeleteErr) {
                      return done(siteDeleteErr);
                    }

                    // Set assertions
                    (siteDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated pods are deleted');

                    // Call the assertion callback
                    done();
                  });
              });
            });
        });
    });
  });

  it('should not be able to delete an site if signed in, but has subscription dependancy, ', function (done) {
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

          // Save a new site
          agent.post('/api/sites')
            .send(site)
            .expect(200)
            .end(function (siteSaveErr, siteSaveRes) {
              // Handle site save error
              if (siteSaveErr) {
                return done(siteSaveErr);
              }
              subscription.site = mongoose.Types.ObjectId(siteSaveRes.body.siteId);
              subscription.tenant = tenant;

              subscription.save(function(err){
                should.not.exists(err);
                // Delete an existing site
                agent.delete('/api/sites/' + siteSaveRes.body.siteId)
                  .send(site)
                  .expect(400)
                  .end(function (siteDeleteErr, siteDeleteRes) {
                    // Handle site error error
                    if (siteDeleteErr) {
                      return done(siteDeleteErr);
                    }

                    // Set assertions
                    (siteDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated subscriptions are deleted!');
                    subscription.remove();
                    // Call the assertion callback
                    done();
                  });
              });
            });
        });
    });
  });

  it('should not be able to delete an site if not signed in', function (done) {
    // Set site user
    site.user = user;

    // Create new site model instance
    var siteObj = new Site(site);

    // Save the site
    siteObj.save(function () {
      // Try deleting site
      request(app).delete('/api/sites/' + siteObj._id)
        .expect(401)
        .end(function (siteDeleteErr, siteDeleteRes) {
          // Set message assertion
          //(siteDeleteRes.body.message).should.match('Session has expired, please login again to access the resource');

          // Handle site error error
          done(siteDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    Site.remove().exec(function () {
      User.remove().exec(function() {
        Tenant.remove().exec(function() {
          Pod.remove().exec(done);
        });
      });
    });
  });
});
