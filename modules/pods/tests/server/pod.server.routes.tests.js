'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Pod = mongoose.model('Pod'),
  Site = mongoose.model('Site'),
  Subscription = mongoose.model('Subscription'),
  Server = mongoose.model('Server'),
  Cluster = mongoose.model('ontap_clusters'),
  Tenant = mongoose.model('Tenant'),
  Subtenant = mongoose.model('Subtenant'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, pod, site, _tenant, cluster, subscription, credentialsAdmin, userAdmin;

/**
 * Pod routes tests
 */
describe('Pod CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'testusername',
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
      email: 'test@test2.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      roles: ['root']
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
      code:'a123435',
      name:'testTenant1'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      _tenant.annotation = 'test';
    }

    site = new Site({
      name: 'testsite1',
      code: 'a121'
    });

    cluster = new Cluster({
      "name": "aaa",
      "uuid": "19158fba-d063-11e8-b4c4-005056a8f8ff",
      "management_ip": "10.20.30.40",
      "provisioning_state": "open",
      "rest_uri": "http://sample.com"
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
    // Save a user to the test db and create new pod
    _tenant.save(function (err) {
      should.not.exist(err);
      user.tenant = _tenant;
      user.save(function () {
        site.user = mongoose.Types.ObjectId(user._id);
        userAdmin.tenant = _tenant;
        userAdmin.save(function (err) {
          should.not.exist(err);
          site.save(function (err) {
            should.not.exist(err);
            cluster.save(function(err) {
              should.not.exist(err);
              pod = {
                name: 'Pod name',
                code: 'testpod',
                siteId: mongoose.Types.ObjectId(site._id),
                vlansAvailable: 12,
                user: mongoose.Types.ObjectId(user._id),
                cluster_keys:[mongoose.Types.ObjectId(cluster._id)]
              };
              done();
            });            
          });
        });
      });
    });
  });

  it('should be able to save a pod if logged in and authorized', function (done) {
    user.roles = ['root'];
    user.phone = 86739486365;
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(200)
            .end(function (podSaveErr, podSaveRes) {
              // Handle pod save error
              if (podSaveErr) {
                done(podSaveErr);
              }

              // Get a list of pods
              agent.get('/api/pods')
                .end(function (podsGetErr, podsGetRes) {
                  // Handle pod save error
                  if (podsGetErr) {
                    done(podsGetErr);
                  }

                  // Get pods list
                  var pods = podsGetRes.body;

                  // Set assertions
                  (pods[0].site.code).should.equal('a121');
                  (pods[0].name).should.match('Pod name');

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should be able to get a pod if logged in and authorized', function (done) {
    user.roles = ['root'];
    user.phone = 86739486365;
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(200)
            .end(function (podSaveErr, podSaveRes) {
              // Handle pod save error
              if (podSaveErr) {
                done(podSaveErr);
              }

              // Get a list of pods
              agent.get('/api/pods/' + podSaveRes.body.podId)
                .end(function (podsGetErr, podsGetRes) {
                  // Handle pod save error
                  if (podsGetErr) {
                    done(podsGetErr);
                  }

                  // Get pods list
                  var pod = podsGetRes.body;

                  // Set assertions
                  (pod.site.code).should.equal('a121');
                  (pod.name).should.match('Pod name');

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should not be able to save an pod if logged in and unauthorized', function (done) {

    userAdmin.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsAdmin)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(403)
            .end(function (podSaveErr, podSaveRes) {
              // Handle pod save error
              if (podSaveErr) {
                done(podSaveErr);
              }
              done(podSaveErr);
            });
        });
    });
  });

  it('should not be able to save an pod if not logged in', function (done) {
    agent.post('/api/pods')
      .send(pod)
      .expect(401)
      .end(function (podSaveErr, podSaveRes) {
        // Call the assertion callback
        done(podSaveErr);
      });
  });

  it('should not be able to save an pod if no name is provided', function (done) {
    // Invalidate title field
    pod.name = '';

    user.roles = ['root'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(400)
            .end(function (podSaveErr, podSaveRes) {
              // Set message assertion
              (podSaveRes.body.message).should.match('Pod name required');

              // Handle pod save error
              done(podSaveErr);
            });
        });
    });
  });

  it('should not be able to save an pod if invalid siteId is provided', function (done) {
    // Invalidate title field
    pod.siteId = 'test';

    user.roles = ['root'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(400)
            .end(function (podSaveErr, podSaveRes) {
              // Set message assertion
              console.log(podSaveRes.body);
              (podSaveRes.body.message).should.match('Invalid Site ID');

              // Handle pod save error
              done(podSaveErr);
            });
        });
    });
  });

  it('should not be able to save an pod if invalid siteId with non-existing objectId is provided', function (done) {
    
    user.roles = ['root'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;
          pod.siteId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(400)
            .end(function (podSaveErr, podSaveRes) {
              // Set message assertion
              console.log(podSaveRes.body);
              (podSaveRes.body.message).should.match('Invalid Site ID');

              // Handle pod save error
              done(podSaveErr);
            });
        });
    });
  });

  it('should not be able to save an pod if no cluster is provided', function (done) {
    // Invalidate title field
    pod.cluster_keys = '';

    user.roles = ['root'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(400)
            .end(function (podSaveErr, podSaveRes) {
              // Set message assertion
              (podSaveRes.body.message).should.match('At least one Cluster need to be specified');

              // Handle pod save error
              done(podSaveErr);
            });
        });
    });
  });

  it('should not be able to save an pod if invalid cluster is provided', function (done) {
    // Invalidate title field
    pod.cluster_keys = ['abc'];

    user.roles = ['root'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(400)
            .end(function (podSaveErr, podSaveRes) {
              // Set message assertion
              (podSaveRes.body.message).should.match('Invalid Cluster Details');

              // Handle pod save error
              done(podSaveErr);
            });
        });
    });
  });

  it('should not be able to save an pod if one of the provided cluster is invalid', function (done) {
    // Invalidate title field
    pod.cluster_keys = ['abc', pod.cluster_keys[0]];

    user.roles = ['root'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(400)
            .end(function (podSaveErr, podSaveRes) {
              // Set message assertion
              (podSaveRes.body.message).should.match('Invalid Cluster Details');

              // Handle pod save error
              done(podSaveErr);
            });
        });
    });
  });

  it('should not be able to save an pod if one of the provided cluster is different object', function (done) {
    // Invalidate title field
    pod.cluster_keys = [user.id, pod.cluster_keys[0]];

    user.roles = ['root'];
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new pod
          agent.post('/api/pods')
            .send(pod)
            .expect(400)
            .end(function (podSaveErr, podSaveRes) {
              // Set message assertion
              (podSaveRes.body.message).should.match('Invalid Cluster details, some of the clusters not found');

              // Handle pod save error
              done(podSaveErr);
            });
        });
    });
  });
  it('should be able to update an pod if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new pod
        agent.post('/api/pods')
          .send(pod)
          .expect(200)
          .end(function (podSaveErr, podSaveRes) {
            // Handle pod save error
            if (podSaveErr) {
              done(podSaveErr);
            }

            // Update pod title
            pod.name = 'WHY YOU GOTTA BE SO MEAN';
            pod.vlansAvailable = '12,34';
            pod.user = mongoose.Types.ObjectId(user._id);

            // Update an existing pod
            agent.put('/api/pods/' + podSaveRes.body.podId)
              .send(pod)
              .expect(200)
              .end(function (podUpdateErr, podUpdateRes) {
                // Handle pod update error
                if (podUpdateErr) {
                  done(podUpdateErr);
                }
                console.log(podUpdateRes.body);
                // Set assertions
                (podUpdateRes.body.podId).should.equal(podSaveRes.body.podId);
                (podUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN');

                // Call the assertion callback
                done();
              });
          });
      });
  });


  it('should not be able to get a single pod if not signed in', function (done) {
    // Create new pod model instance
    var podObj = new Pod(pod);

    // Save the pod
    podObj.save(function (err) {
      request(app).get('/api/pods/' + podObj._id)
        .expect(401)
        .end(function (err, res) {
          if (err) {
            done(err);
          }

          // Call the assertion callback
          done(err);
        });
    });
  });

  it('should return proper error for single pod with an invalid Id', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        // test is not a valid mongoose Id
        request(app).get('/api/pods/test')
          .end(function (req, res) {
            // Set assertion
            res.body.should.be.instanceof(Object).and.have.property('message', 'Pod is invalid');

            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to delete an pod if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new pod
        agent.post('/api/pods')
          .send(pod)
          .expect(200)
          .end(function (podSaveErr, podSaveRes) {
            // Handle pod save error
            if (podSaveErr) {
              done(podSaveErr);
            }

            // Delete an existing pod
            agent.delete('/api/pods/' + podSaveRes.body.podId)
              .send(pod)
              .expect(200)
              .end(function (podDeleteErr, podDeleteRes) {
                // Handle pod error error
                if (podDeleteErr) {
                  done(podDeleteErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an pod if signed in, but pod has vFASS dependancy', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // Save a new pod
        agent.post('/api/pods')
          .send(pod)
          .expect(200)
          .end(function (podSaveErr, podSaveRes) {
            // Handle pod save error
            if (podSaveErr) {
              done(podSaveErr);
            }

            var subtenant = new Subtenant({
              name: 'Subtenant Name',
              code: 'testsub1',
              tenant:mongoose.Types.ObjectId(_tenant._id),
            });

            subtenant.save(function(err) {
              should.not.exists(err);
              subscription.site = site;
              subscription.tenant = _tenant;
              subscription.save(function(err) {
                should.not.exist(err);
                var server = new Server({
                  site: mongoose.Types.ObjectId(site._id),
                  subtenant: mongoose.Types.ObjectId(subtenant._id),
                  pod:mongoose.Types.ObjectId(podSaveRes.body.podId),
                  name: 'Test Server',
                  subnet: '10.20.30.64/26',
                  managed: 'Portal',
                  subscription: subscription
                });

                server.save(function (err) {
                  should.not.exists(err);
                  // Delete an existing pod
                  agent.delete('/api/pods/' + podSaveRes.body.podId)
                    .send(pod)
                    .expect(400)
                    .end(function (podDeleteErr, podDeleteRes) {
                      if (podDeleteErr) {
                        done(podDeleteErr);
                      }
                      // Set assertions
                      (podDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated vFASS are deleted');
                      server.remove();
                      // Call the assertion callback
                      done();
                    });
                });
              });
            });
          });
      });
  });

  it('should not be able to delete an pod if not signed in', function (done) {
    // Set pod user
    pod.user = user;

    // Create new pod model instance
    var podObj = new Pod(pod);

    // Save the pod
    podObj.save(function () {
      // Try deleting pod
      agent.delete('/api/pods/' + podObj._id)
        .expect(401)
        .end(function (podDeleteErr, podDeleteRes) {
          // Set message assertion
          //(podDeleteRes.body.message).should.match('Session has expired, please login again to access the resource');

          // Handle pod error error
          done(podDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Cluster.remove().exec(function(){
        Pod.remove().exec(function(){
          Site.remove().exec(function(){
            Subscription.remove().exec(function(){
              Tenant.remove().exec(done);
            });
          });
        });
      });
    });
  });
});
