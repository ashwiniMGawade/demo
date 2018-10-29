'use strict';

var should = require('should'),
  _ = require('lodash'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  moment = require('moment'),
  User = mongoose.model('User'),
  logger = require(path.resolve('./config/lib/log')),
  Tenant = mongoose.model('Tenant'),
  Notification = mongoose.model('Notification'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, subtenant, subTenant, notification, server, _tenant, pod, site, tenant, credentialsAdmin, userAdmin;

/**
 * Subtenant routes tests
 */
describe('Notifications CRUD tests', function () {
   this.timeout(10000);

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
    credentialsAdmin = {
      username: 'adminuser',
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

    _tenant = new Tenant({
      name: 'Tenant Name',
      code: 'ttttt'
    });

    tenant = new Tenant({
      name: 'Tenant Names',
      code: 'tttts'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
      _tenant.annotation = 'test';
    }

    tenant.save(function(err){
      should.not.exist(err);
    });
    var utcMoment = moment.utc();

    _tenant.save(function (err) {
      should.not.exist(err);
      user.tenant = _tenant;
      userAdmin.tenant = _tenant;
      userAdmin.save(function(err){
        should.not.exist(err);
        user.save(function(err){
          should.not.exist(err);
          notification = {
            user: user,
            message: 'test message',
            summary: 'test cluster text',
            category: 'Information',
            start: new Date(new Date(utcMoment.format()).getTime() + 9000),
            end: new Date(new Date(utcMoment.format()).getTime() + 160000),
            tenants: [_tenant],
            tenantsId: [_tenant._id]
          };
          done();
        });
      });
    });
  });

  it('should not be able to save an notifications if not logged in', function (done) {
    agent.post('/api/notifications')
      .send(notification)
      .expect(401)
      .end(function (subtenantSaveErr, subtenantSaveRes) {
        // Call the assertion callback
        done(subtenantSaveErr);
      });

  });

  it('should not be able to save an notifications if logged in and but not authorized user', function (done) {
    userAdmin.roles = ['user'];
    userAdmin.save(function(err){
      should.not.exist(err);
      agent.post('/api/auth/signin')
      .send(credentialsAdmin)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(403)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }
            done(notificationSaveErr);
          });
      });
    });
  });

  it('should be able to save an notifications if logged in and authorized user is root', function (done) {
    user.roles = ['root'];
    user.username = credentials.username;
    user.password = credentials.password;
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
        notification.sendEmail = false;
        // Save a new notification
        agent.post('/api/notifications')
          .send(notification)
          //.expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }

            (notificationSaveRes.body.message).should.equal(notification.message);
            // Call the assertion callback
            done();

          });
      });
    });

  });

  it('should not be able to save an notification if no message is provided', function (done) {
    // Invalidate message field
    notification.message = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(400)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Set message assertion
            (notificationSaveRes.body.message.message).should.match('Message required');
            // Handle notification save error
            done(notificationSaveErr);
          });
      });
  });

  it('should not be able to save an notification if invalid sendEmail value is provided', function (done) {
    // Invalidate message field
    notification.sendEmail = 'test';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(400)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Set message assertion
            (notificationSaveRes.body.message).should.match('sendEmail should be of Boolean type');
            // Handle notification save error
            done(notificationSaveErr);
          });
      });
  });

  it('should be able to update an notification if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }

            // Update notification name
            notification.message = 'Updated notification message';

            // Update an existing notification
            agent.put('/api/notifications/' + notificationSaveRes.body.notificationId)
              .send(notification)
              .expect(200)
              .end(function (notificationUpdateErr, notificationUpdateRes) {
                // Handle notification update error
                if (notificationUpdateErr) {
                  return done(notificationUpdateErr);
                }

                // Set assertions
                (notificationUpdateRes.body.notificationId).should.equal(notificationSaveRes.body.notificationId);
                (notificationUpdateRes.body.message).should.match('Updated notification message');

                // Call the assertion callback
                done();
              });
          });
      });
  });


  it('should not be able to update an notification if user is admin, only acknowledge field chanages', function (done) {

    userAdmin.save(function(err){
      should.not.exist(err);
      agent.post('/api/auth/signin')
      .send(credentialsAdmin)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new notification
        var notificationObj = new Notification(notification);

        notificationObj.save(function(err){
          should.not.exist(err);

          notification.message = 'test update';
          agent.put('/api/notifications/' + notificationObj._id)
            .send(notification)
            .expect(200)
            .end(function (notificationUpdateErr, notificationUpdateRes) {
              // Handle notification update error
              if (notificationUpdateErr) {
                return done(notificationUpdateErr);
              }

              (notificationUpdateRes.body.message).should.not.match('test update');
              // var containsUser = _.includes(_.invokeMap(notificationUpdateRes.body.users, 'toString'), userAdmin._id.toString());
              // (containsUser).should.be.equal(true);             
              notificationUpdateRes.body.acknowledge.should.equal(true);

              // Call the assertion callback
              done();
            });
        });
      });
    });

  });

  it('should not be able to update an notification if message is blank with root user', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }

            // Update notification name
            notification.message = '';

            // Update an existing notification
            agent.put('/api/notifications/' + notificationSaveRes.body.notificationId)
              .send(notification)
              .expect(400)
              .end(function (notificationUpdateErr, notificationUpdateRes) {
                // Handle notification update error
                if (notificationUpdateErr) {
                  return done(notificationUpdateErr);
                }
                (notificationUpdateRes.body.message.message).should.match('Message required');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of notifications if signed in', function (done) {
    // Create new notification model instance
    var notificationObj = new Notification(notification);

    // Save the notification
    notificationObj.save(function () {
      agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/notifications')
          .send(notification)
          .expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }        
            // Request notifications
            agent.get('/api/notifications')
              .expect(200)
              .end(function (err, res) {
                // Call the assertion callback
                (res.body.length).should.be.above(0);
                done(err);
              });
          });
      });
    });
  });

  it('should be able to get a list of notifications if signed in with admin', function (done) {
    userAdmin.save(function(err){
      should.not.exist(err);
      // Create new notification model instance
      var notificationObj = new Notification(notification);

      // Save the notification
      notificationObj.save(function () {
        agent.post('/api/auth/signin')
        .send(credentialsAdmin)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }   
         
          // Request notifications
          setTimeout(function() { 
            agent.get('/api/notifications')
            .expect(200)
            .end(function (err, res) {
              // Call the assertion callback
              console.log(res.body);
              (res.body.length).should.be.above(0);
              done(err);
            });
          }, 9000);
        });
      });
    });
  });


  it('should not be able to get a list of notifications if not signed in', function (done) {
    // Create new notification model instance
    var notificationObj = new Notification(notification);

    // Save the notification
    notificationObj.save(function () {
      // Request notifications
      request(app).get('/api/notifications')
        .expect(401)
        .end(function (err, res) {
          // Call the assertion callback
          done(err);
        });

    });
  });

  it('should not be able to get a single notification if not signed in', function (done) {
    // Create new notification model instance
    var notificationObj = new Notification(notification);

    // Save the notification
    notificationObj.save(function () {
      request(app).get('/api/notifications/' + notificationObj._id)
        .expect(401)
        .end(function (err, res) {
          // Call the assertion callback
          done(err);
        });
    });
  });

  it('should be able to get an notification if signed in and authorized with admin user', function (done) {
    user.roles = ['admin'];
    user.tenant = _tenant._id;
    user.save(function(err) {
      agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        var notificationObj = new Notification(notification);

        // Save the notification
        notificationObj.save(function () {
          agent.get('/api/notifications/' + notificationObj._id)
            .send(notification)
            //.expect(200)
            .end(function (notificationErr, notificationRes) {
              // Handle notification update error
              if (notificationErr) {
                return done(notificationErr);
              }

              // Set assertions
              (notificationObj.message).should.equal(notificationRes.body.message);
              // Call the assertion callback
              done();
            });
        });
      });
    });
  });

  it('should return proper error for single notification with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    agent.get('/api/notifications/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Notification is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single notification which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent subtenant
    agent.get('/api/notifications/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No notification with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an notification if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }

            // Delete an existing notification
            agent.delete('/api/notifications/' + notificationSaveRes.body.notificationId)
              .send(notification)
              .expect(200)
              .end(function (notificationDeleteErr, notificationDeleteRes) {
                // Handle notification error error
                if (notificationDeleteErr) {
                  return done(notificationDeleteErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
  });


  it('should not be able to delete an notification if not signed in', function (done) {
    // Set notification user
    notification.user = user;

    // Create new notification model instance
    var notificationObj = new Notification(notification);

    // Save the notification
    notificationObj.save(function () {
      // Try deleting notification
      request(app).delete('/api/notifications/' + notificationObj._id)
        .expect(401)
        .end(function (notificationDeleteErr, notificationDeleteRes) {
          // Set message assertion
          //(notificationDeleteRes.body.message).should.match('Session has expired, please login again to access the resource');

          // Handle notification error error
          done(notificationDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      //Tenant.remove().exec(done);
      Tenant.remove().exec(function() {
        Notification.remove().exec(done);
      });
    });
  });
});
