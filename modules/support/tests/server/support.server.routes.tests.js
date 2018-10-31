'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  featuresSettings = require(path.resolve('./config/features')),
  express = require(path.resolve('./config/lib/express'));

/**
* Globals
*/

var app, agent, credentials, user, tenant;

/**
* support routes test cases
*/

describe('support server controller test cases', function() {
  before(function(done){
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);
    done();
  });

  beforeEach(function(done){
    credentials =  {
      username: 'testuser',
      password: 'Qwerty1234%'
    };

    user =  new User({
      firstName : 'testuser',
      lastName: 'testuser',
      displayName: 'Full Name',
      email: 'tesat@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      phone: 12312312312
    });

    tenant = new Tenant({
      name: 'tenant',
      code: 'tenant'
    });

      //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
    }

    tenant.save(function (err) {
      if (err) {
        should.not.exist(err);
      }
      user.tenant = tenant;
      user.save(function(err){
        should.not.exist(err);
        done();
      });
    });
  });

  // it('should be able to download the software link if logged in', function(done) {
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         done(signinErr);
  //       }
  //       agent.get('/api/support/downloads?software=cloud-manager')
  //       .expect(200)
  //       .end(function(err, res) {
  //         if (err) {
  //           done(err);
  //         }
  //         done();
  //       });
  //     });    
  // });

  it('should not be able to download the software link if not logged in', function(done) {    
    agent.get('/api/support/downloads?software=cloud-manager')
    .expect(401)
    .end(function(err, res) {
      if (err) {
        done(err);
      }
      done();
    });
  });

  it('should not be able to get the master key if not logged in', function(done) {    
    agent.get('/api/support/softwarekey?software=ontapdsm')
    .expect(401)
    .end(function(err, res) {
      if (err) {
        done(err);
      }
      done();
    });
  });

  it('should be able to accept the privacy policy if logged in', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        agent.post('/api/support/policy')
        .send({'user': signinRes.body.userId})
        //.expect(200)
        .end(function(err, res) {
          console.log(err);
          console.log(res.body);
          if (err) {
            done(err);
          }
          (res.body.acceptTC).should.be.equal(true);
          done();
        });
      });    
  });

  it('should not be able to accept the policy if not logged in', function(done) {    
    agent.post('/api/support/policy')
    .expect(401)
    .end(function(err, res) {
      if (err) {
        done(err);
      }
      done();
    });
  });

  // it('should be able to get the master key if logged in and key exist', function(done) {
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         done(signinErr);
  //       }
  //       agent.get('/api/support/softwarekey?software=ontapdsm')
  //       .expect(200)
  //       .end(function(err, res) {
  //         if (err) {
  //           done(err);
  //         }
  //         done();
  //       });
  //     });    
  // });

  it('should be able to error when trying to get the master key and key does not exist for sowftware', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        agent.get('/api/support/softwarekey?software=cloud-manager')
        .expect(400)
        .end(function(err, res) {
          if (err) {
            done(err);
          }
          done();
        });
      });    
  });


  afterEach(function (done) {
    Tenant.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});