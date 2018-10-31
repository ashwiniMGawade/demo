'use strict';

var should = require('should'),
  request = require('supertest'),
  _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),  
  featuresSettings = require(path.resolve('./config/features')),
  Tenant = mongoose.model('Tenant'),  
  express = require(path.resolve('./config/lib/express'));


  var app, agent, user, tenant1, credentials;


  describe('Lookups route tests:', function() {
    before(function(done){
      // get the application
      app = express.init(mongoose.connection.db);
      agent = request.agent(app);
      done();
    });

    beforeEach(function(done){
      credentials = {
        username: 'username',
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

      tenant1 = new Tenant({
        name: 'Tenant Name',
        code: 'tttt'
      });

       //initialize annotation when setting is enabled
      if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
        tenant1.annotation = 'test';
      }

      tenant1.save(function (err) {
        should.not.exist(err);
        user.tenant = tenant1;  
        user.save(function(err){
          should.not.exist(err);
          done();
        });
      });
    });// end of foreach

  it('should be able to get list of status if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/status')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('Creating');
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of sgstatus if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/sgStatus')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('Creating');
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of sustatus if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/suStatus')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('Creating');
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of managed if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/managed')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('Portal');
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of protocol if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/protocol')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('nfs');
            // Call the assertion callback
            done();
          });
    });
  });


  it('should be able to get list of lunos if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/lunos')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of icrstatus if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/icrstatus')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('Creating');
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of notificationCategory if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/notificationCategory')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('Information');
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of provider if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/provider')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('local');
            // Call the assertion callback
            done();
          });
    });
  });

  it('should be able to get list of storagePackClasses if signed in and authorized user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        done(signinErr);
      }
        // Get an existing job
        agent.get('/api/lookups/storagePackClasses')
          .expect(200)
          .end(function (lookupErr, lookupRes) {
            // Handle job update error
            if (lookupErr) {
              done(lookupErr);
            }
            // Set assertions
            (lookupRes.body.length).should.be.above(0);
            (lookupRes.body).should.containEql('ontap-standard');
            // Call the assertion callback
            done();
          });
    });
  });


  afterEach(function (done) {
    User.remove().exec(function () {
      //Tenant.remove().exec(done);
      Tenant.remove().exec(function() {        
        done();
      });             
    });
  });

});