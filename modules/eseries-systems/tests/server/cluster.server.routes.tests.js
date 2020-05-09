'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Cluster = mongoose.model('ontap_clusters'),
  Site = mongoose.model('Site'),
  Subscription = mongoose.model('Subscription'),
  Pod = mongoose.model('Pod'),
  Tenant = mongoose.model('Tenant'),
  Subtenant = mongoose.model('Subtenant'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, pod, _tenant, subscription, credentialsAdmin, userAdmin, cluster, site;

/**
 * Cluster routes tests
 */
describe('Cluster CRUD tests', function () {

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

    
    subscription = new Subscription({
      name: 'test subscription',
      code: 'testsub',
      url: 'http://test.com',
      description: 'this is the test subscription'
    });

    site = new Site({
      name: 'testsite1',
      code: 'a121'
    });

    pod = new Pod({
      name: 'Pod name',
      code: 'testpod',
      vlansAvailable: 12
    });

    //initialize subscription pack when prepaid payment method setting is enabled
    if (featuresSettings.paymentMethod.prePaid) {
      subscription.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
    }
    // Save a user to the test db and create new cluster
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
            cluster = {
              name: 'cluster',
              uuid: '19158fba-d063-11e8-b4c4-005056a8f8ff',
              management_ip:"10.20.30.40",
              provisioning_state:"open",
              rest_uri:"http://sample.com",
              user: user
            };
            done();
          });
        });
      });
    });
  });

  it('should be able to save a cluster if logged in and authorized', function (done) {
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
            return done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new cluster
          agent.post('/api/clusters')
            .send(cluster)
            .expect(200)
            .end(function (clusterSaveErr, clusterSaveRes) {
              // Handle cluster save error
              if (clusterSaveErr) {
                return done(clusterSaveErr);
              }

              // Get a list of clusters
              agent.get('/api/clusters')
                .end(function (clustersGetErr, clustersGetRes) {
                  // Handle cluster save error
                  if (clustersGetErr) {
                    return done(clustersGetErr);
                  }

                  // Get clusters list
                  var clusters = clustersGetRes.body;

                  // Set assertions
                  (clusters[0].name).should.match('cluster');

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should be able to get a cluster if logged in and authorized', function (done) {
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
            return done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new cluster
          agent.post('/api/clusters')
            .send(cluster)
            .expect(200)
            .end(function (clusterSaveErr, clusterSaveRes) {
              // Handle cluster save error
              if (clusterSaveErr) {
                return done(clusterSaveErr);
              }

              // Get a list of clusters
              agent.get('/api/clusters/' + clusterSaveRes.body.clusterId)
                .end(function (clustersGetErr, clustersGetRes) {
                  // Handle cluster save error
                  if (clustersGetErr) {
                    return done(clustersGetErr);
                  }

                  // Get clusters list
                  var cluster = clustersGetRes.body;

                  // Set assertions
                  (cluster.name).should.match('cluster');

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should not be able to save an cluster if logged in and unauthorized', function (done) {

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

          // Save a new pod
          agent.post('/api/clusters')
            .send(cluster)
            .expect(403)
            .end(function (clusterSaveErr, clusterSaveRes) {
              // Handle cluster save error
              if (clusterSaveErr) {
                return done(clusterSaveErr);
              }
              done(clusterSaveErr);
            });
        });
    });
  });

  it('should not be able to save an cluster if not logged in', function (done) {
    agent.post('/api/clusters')
      .send(cluster)
      .expect(401)
      .end(function (clusterSaveErr, clusterSaveRes) {
        // Call the assertion callback
        done(clusterSaveErr);
      });
  });

  it('should not be able to save an cluster if no name is provided', function (done) {
    // Invalidate title field
    cluster.name = '';

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

          // Save a new cluster
          agent.post('/api/clusters')
            .send(cluster)
            .expect(400)
            .end(function (clusterSaveErr, clusterSaveRes) {
              // Set message assertion
              (clusterSaveRes.body.message).should.match('Cluster name required');

              // Handle cluster save error
              done(clusterSaveErr);
            });
        });
    });
  });

  it('should be able to update an cluster if signed in', function (done) {
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

        // Save a new cluster
        agent.post('/api/clusters')
          .send(cluster)
          .expect(200)
          .end(function (clusterSaveErr, clusterSaveRes) {
            // Handle cluster save error
            if (clusterSaveErr) {
              return done(clusterSaveErr);
            }

            // Update cluster
            cluster.name = 'test123';
            cluster.managed_ip = '12.34.12.12';
            cluster.user = mongoose.Types.ObjectId(user._id);

            // Update an existing cluster
            agent.put('/api/clusters/' + clusterSaveRes.body.clusterId)
              .send(cluster)
              .expect(200)
              .end(function (clusterUpdateErr, clusterUpdateRes) {
                // Handle cluster update error
                if (clusterUpdateErr) {
                  return done(clusterUpdateErr);
                }
                // Set assertions
                (clusterUpdateRes.body.clusterId).should.equal(clusterSaveRes.body.clusterId);
                (clusterUpdateRes.body.name).should.match('test123');

                // Call the assertion callback
                done();
              });
          });
      });
  });


  it('should not be able to get a single cluster if not signed in', function (done) {
    // Create new cluster model instance
    var clusterObj = new Cluster(cluster);

    // Save the cluster
    clusterObj.save(function (err) {
      request(app).get('/api/clusters/' + clusterObj._id)
        .expect(401)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          // Call the assertion callback
          done(err);
        });
    });
  });

  it('should return proper error for single cluster with an invalid Id', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // test is not a valid mongoose Id
        request(app).get('/api/clusters/test')
          .end(function (req, res) {
            // Set assertion
            res.body.should.be.instanceof(Object).and.have.property('message', 'Cluster is invalid');

            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to delete an cluster if signed in', function (done) {
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

        // Save a new cluster
        agent.post('/api/clusters')
          .send(cluster)
          .expect(200)
          .end(function (clusterSaveErr, clusterSaveRes) {
            // Handle cluster save error
            if (clusterSaveErr) {
              return done(clusterSaveErr);
            }

            // Delete an existing cluster
            agent.delete('/api/clusters/' + clusterSaveRes.body.clusterId)
              .send(cluster)
              .expect(200)
              .end(function (clusterDeleteErr, clusterDeleteRes) {
                // Handle cluster error error
                if (clusterDeleteErr) {
                  return done(clusterDeleteErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an cluster if signed in, but cluster has pods dependancy dependancy', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new pod
        agent.post('/api/clusters')
          .send(cluster)
          .expect(200)
          .end(function (clusterSaveErr, clusterSaveRes) {
            // Handle cluster save error
            if (clusterSaveErr) {
              return done(clusterSaveErr);
            }

            pod.cluster_keys = [clusterSaveRes.body.clusterId];
            pod.siteId = site._id;
            pod.save(function (err) {
              should.not.exists(err);
              // Delete an existing cluster
              agent.delete('/api/clusters/' + clusterSaveRes.body.clusterId)
                .send(cluster)
                .expect(400)
                .end(function (clusterDeleteErr, clusterDeleteRes) {
                  if (clusterDeleteErr) {
                    return done(clusterDeleteErr);
                  }
                  // Set assertions
                  (clusterDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated clusters are deleted from the pods');
                  pod.remove();
                  // Call the assertion callback
                  done();
                });
            });
          });
      });
  });

  it('should not be able to delete an cluster if not signed in', function (done) {
    // Set cluster user
    cluster.user = user;

    // Create new cluster model instance
    var clusterObj = new Cluster(cluster);

    // Save the cluster
    clusterObj.save(function () {
      // Try deleting cluster
      agent.delete('/api/clusters/' + clusterObj._id)
        .expect(401)
        .end(function (clusterDeleteErr, clusterDeleteRes) {
          // Set message assertion
          //(clusterDeleteRes.body.message).should.match('Session has expired, please login again to access the resource');

          // Handle cluster error error
          done(clusterDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Cluster.remove().exec(function(){
        Site.remove().exec(function(){
          Subscription.remove().exec(function(){
            Tenant.remove().exec(done);
          });
        });
      });
    });
  });
});
