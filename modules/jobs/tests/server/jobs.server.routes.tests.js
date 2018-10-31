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
  Job = mongoose.model('Job'),
  Subtenant = mongoose.model('Subtenant'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, credentialsRead, user, userRead, job, pod, site;
var subtenant1, subtenant2, job1, job2, server1, server2, tenant1, tenant2, subscription1, subscription2, partnerTenant;

/** 
 * Subtenant routes tests
 */
describe('Jobs CRUD tests', function () {

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
    
    partnerTenant.save(function(err) {
      should.not.exist(err);
      tenant1.partner = partnerTenant;
      tenant1.save(function (err) {
        should.not.exist(err);
        tenant1.tenantId = tenant1._id;
        tenant1.save(function (err) {
          tenant2.save(function(err) {
            should.not.exist(err);
            user.tenant = tenant1;
            userRead.tenant = tenant1;     
            user.save(function(err){
              should.not.exist(err);
              userRead.save(function(err){
                job = {
                  user: userRead,          
                  tenant: {'code' : tenant1.code, 'tenantId' : tenant1._id},
                  operation:'Create',
                  module:'job',
                  payload:{}
                };
                job2 = new Job({
                  user: user,          
                  tenant: tenant2,
                  operation:'Create',
                  module:'job',
                  payload:{}
                });
                job2.save(function(err) {
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

  ///////////////////////////////// list ////////////////////////////////////////

  it('should not be able to get a list of jobs if not signed in', function (done) {
    // Create new job model instance
    var jobObj = new Job(job);

    // Save the job
    jobObj.save(function () {
      // Request jobs
      request(app).get('/api/jobs')
        .expect(401)
        .end(function (err, res) {
          // Call the assertion callback
          done(err);
        });

    });
  });

  it('should not be able to get a single job if not signed in', function (done) {
    // Create new job model instance
    var jobObj = new Job(job);

    // Save the job
    jobObj.save(function () {
      request(app).get('/api/jobs/' + jobObj._id)
        .expect(401)
        .end(function (err, res) {
          // Call the assertion callback
          done(err);
        });
    });
  });

  it('should be able to get an job if signed in and authorized with read user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save a new job
      var jobObj = new Job(job);

      // Save the job
      jobObj.save(function (jobSaveErr, jobSaveRes) {
        if (jobSaveErr) {
          return done(jobSaveErr);
        }
         
        // Get an existing job
        agent.get('/api/jobs/' + jobSaveRes._id)
          .send(job)
          .expect(200)
          .end(function (jobErr, jobRes) {
            // Handle job update error
            if (jobErr) {
              return done(jobErr);
            }
            // Set assertions
            (jobSaveRes._id.toString()).should.equal(jobRes.body.jobId);
            // Call the assertion callback
            done();
          });
      });
    });
  });

  it('should be able to get list of jobs if signed in and authorized with read user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save a new job
      var jobObj = new Job(job);
      jobObj.tenant = {'code' : tenant1.code, 'tenantId' : tenant1._id};

      // Save the job
      jobObj.save(function (jobSaveErr, jobSaveRes) {
        if (jobSaveErr) {
          return done(jobSaveErr);
        }
         
        // Get an existing job
        agent.get('/api/jobs')
          .expect(200)
          .end(function (jobErr, jobRes) {
            // Handle job update error
            if (jobErr) {
              return done(jobErr);
            }
            // Set assertions
            (jobRes.body.length).should.be.above(0);
            // Call the assertion callback
            done();
          });
      });
    });
  });

  it('should be able to get list of jobs if signed in and authorized with root user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Save a new job
      var jobObj = new Job(job);

      // Save the job
      jobObj.save(function (jobSaveErr, jobSaveRes) {
        if (jobSaveErr) {
          return done(jobSaveErr);
        }
         
        // Get an existing job
        agent.get('/api/jobs?search=create')
          .expect(200)
          .end(function (jobErr, jobRes) {
            // Handle job update error
            if (jobErr) {
              return done(jobErr);
            }
            // Set assertions
            (jobRes.body.length).should.be.above(0);
            // Call the assertion callback
            done();
          });
      });
    });
  });

  it('should not be able to get an job if signed in and authorized with read user of other tenant', function (done) {
    // login with the read user
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get an existing job
      agent.get('/api/jobs/' + job2._id)
        .expect(403)
        .end(function (jobErr, jobRes) {          
          done();
        });
    });
  });

  it('should return proper error for single job with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    agent.get('/api/jobs/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Job is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single job which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent subtenant
    agent.get('/api/jobs/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No job with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should return data for single job if signed in with read user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      var jobObj = new Job(job);

      // Save the job
      jobObj.save(function (jobSaveErr, jobSaveRes) {
        if (jobSaveErr) {
          return done(jobSaveErr);
        }
         
        // Get an existing job
        agent.get('/api/jobs/' + jobSaveRes._id)
          .expect(200)
          .end(function (jobErr, jobRes) {    
            (jobRes.body.jobId.toString()).should.equal(jobSaveRes._id.toString());      
            done();
          });
      });
    });
  });

  it('should return data for single job if signed in with root user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentials)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      var jobObj = new Job(job);

      // Save the job
      jobObj.save(function (jobSaveErr, jobSaveRes) {
        if (jobSaveErr) {
          return done(jobSaveErr);
        }
         
        // Get an existing job
        agent.get('/api/jobs/' + jobSaveRes._id)
          .expect(200)
          .end(function (jobErr, jobRes) {  
            (jobRes.body.jobId.toString()).should.equal(jobSaveRes._id.toString()); 
            done();
          });
      });

    });
  });

  ///////////////////////////////// DELETE ////////////////////////////////////

 
  if(_.includes(featuresSettings.roles.job.read, 'partner')){
    it('should be able to get the job under his partnership if signed in with partner', function (done) {
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
            // Get a list of jobs
            agent.get('/api/jobs/'+job1._id)
              .expect(200)
              .end(function (jobGetErr, jobGetRes) {
                // Handle job save error
                if (jobGetErr) {
                  return done(jobGetErr);
                }
                // Get jobs list
                var job = jobGetRes.body;

                // Set assertions
                (job.message).should.equal(job1.message);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to get the job which is not under his partnership if signed in with partner', function (done) {
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
            // Get a list of jobs
            agent.get('/api/jobs/'+job2._id)
              .expect(403)
              .end(function (jobsGetErr, jobsGetRes) {                
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.job.list, 'partner')){
    it('should be able to list the jobs under his partnership if signed in with partner', function (done) {
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
            // Get a list of jobs
            agent.get('/api/jobs')
              .expect(200)
              .end(function (jobsGetErr, jobsGetRes) {
                // Handle job save error
                if (jobsGetErr) {
                  return done(jobsGetErr);
                }
                // Get jobs list
                var jobs = jobsGetRes.body;

                // Set assertions
                (jobs[0].message).should.equal('test message');
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to list the jobs which are not under his partnership if signed in with partner', function (done) {
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
            // Get a list of jobs
            agent.get('/api/jobs')
              .expect(200)
              .end(function (jobsGetErr, jobsGetRes) {
                // Handle job save error
                if (jobsGetErr) {
                  return done(jobsGetErr);
                }
                // Get jobs list
                var jobs = jobsGetRes.body;
                console.log(jobs.length);

                // Set assertions
                (jobs[0].message).should.not.be.equal(job2.message);
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.job.update,'partner')){
    it('should be able to update a job under his partnership if signed in with partner', function (done) {
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
            job1.message = "testing1";
            // Get a list of jobs
            agent.put('/api/jobs/'+job1._id)
              .send(job1)
              .expect(200)
              .end(function (jobsGetErr, jobsGetRes) {
                // Handle job save error
                if (jobsGetErr) {
                  return done(jobsGetErr);
                }
                // Get jobs list
                var jobs = jobsGetRes.body;

                // Set assertions
                (jobs.message).should.match('testing1');

                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to update a job not under his partnership if signed in with partner', function (done) {
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
            job2.message = "testing1";
            // Get a list of jobs
            agent.put('/api/jobs/'+job2._id)
              .send(job2)
              .expect(403)
              .end(function (jobsGetErr, jobsGetRes) {
                // Handle job save error
                if (jobsGetErr) {
                  return done(jobsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.job.delete,'partner')){
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
            // Get a list of jobs
            agent.delete('/api/jobs/'+job1._id)
              .expect(200)
              .end(function (jobsGetErr, jobsGetRes) {
                // Handle job save error
                if (jobsGetErr) {
                  return done(jobsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to delete a job not under his partnership if signed in with partner', function (done) {
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
            // Get a list of jobs
            agent.put('/api/jobs/'+job2._id)
              .expect(403)
              .end(function (jobsGetErr, jobsGetRes) {
                // Handle job save error
                if (jobsGetErr) {
                  return done(jobsGetErr);
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
        Job.remove().exec(done);
      });             
    });
  });
});
