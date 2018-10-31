'use strict';

var should = require('should'),
  request = require('supertest'),
  _ = require('lodash'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  config = require(path.resolve('./config/config')),
  nock = require('nock'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  Site = mongoose.model('Site'),
  Subtenant = mongoose.model('Subtenant'),
  Server = mongoose.model('Server'),
  Subscription = mongoose.model('Subscription'),
  Storagegroup = mongoose.model('Storagegroup'),
  Storageunit = mongoose.model('Storageunit'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, site, credentialsRead, userRead;
var tenant1, tenant2, subtenant1, subtenant2, storagegroup, storagegroup1, 
storagegroup2, subscription1, subscription2, server1, server2, partnerTenant;

/**
 * Storage Group routes tests
 */
describe('Storage Group CRUD tests', function () {

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
      username: 'usernametwo',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      roles: ['root']
    });

    userRead = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test1@test.com',
      username: credentialsRead.username,
      password: credentialsRead.password,
      provider: 'local',
      roles: ['read']
    });

    site = new Site({
      name: 'Site name',
      code: 'site'
    });

    partnerTenant = new Tenant({
      code:'ptc',
      name:'partnerTenant'
    });

    tenant1 = new Tenant({
      code:'a1452',
      name:'testTenant1'
    });

    tenant2 = new Tenant({
      code:'a1453',
      name:'testTenant2'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant1.annotation = 'test';
      tenant2.annotation = 'test';
      partnerTenant.annotation = 'test';
    }

    subtenant1 = new Subtenant({
      name: 'Subtenant Name',
      code: 'testsub1'
    });

    subtenant2 = new Subtenant({
      name: 'Subtenant Name two',
      code: 'testsub2'
    });

    subscription1 = new Subscription({
      name: 'test subscription',
      code: 'testsub',
      url: 'http://test.com',
      description: 'this is the test subscription'
    });

    subscription2 = new Subscription({
      name: 'test subscription',
      code: 'testsubtwo',
      url: 'http://test.com',
      description: 'this is the second test subscription'
    });

    //initialize subscription pack when prepaid payment method setting is enabled
    if (featuresSettings.paymentMethod.prePaid) {
      subscription1.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
      subscription2.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
    }
    
    server1 = new Server({
      name: 'Test Server',
      subnet: '10.20.30.64/26',
      managed: 'Portal',
      status: 'Operational',
      nfs:true
    });

    server2 = new Server({
      name: 'Test Server two',
      subnet: '10.20.30.64/26',
      managed: 'Portal',
      status: 'Operational',
      nfs:true
    });

    storagegroup1 = new Storagegroup({
      name: 'Test Storage one',
      code: 'testcode1',
      tier: 'standard',
      snapshotPolicy: '7daily1810',
      status: 'Operational'
    });

    storagegroup2 = new Storagegroup({
      name: 'Test Storage two',
      code: 'testcode2',
      tier: 'standard',
      snapshotPolicy: '7daily1810',
      status: 'Operational'
    });

    //Mock for WFA Storage Group Create Job
    nock('http://wfatestportal.com')
        .post('/sgCreate/jobs')
        .reply(200, {"job":{"$":{
                                   "xmlns:atom":"http://www.w3.org/2005/Atom",
                                   "jobId":"65370"
                                }
                            }
                    }
              );
    //Mock for WFA Storage Group Create Status Job
    nock('http://wfatestportal.com')
        .get('/sgCreate/jobs/65370')
        .reply(200, {
                      "job":{
                            "jobStatus": [{"jobStatus":['COMPLETED'], "phase":[]}]
                            }
                    }
              );

    //Mock for WFA Storage Group Update Job
    nock('http://wfatestportal.com')
        .post('/sgUpdate/jobs')
       	.reply(200, {
       			          "job":{
    	  				            "$":{
      					                   "xmlns:atom":"http://www.w3.org/2005/Atom",
    	  					                 "jobId":"65380"
      				                  }
      			                }
        		        }
     		      );
    //Mock for WFA Storage Group Update Status Job
    nock('http://wfatestportal.com')
        .get('/sgUpdate/jobs/65380')
       	.reply(200, {
                       "job":{
                             "jobStatus": [{"jobStatus":['COMPLETED'], "phase":[]}]
                             }
        		        }
     		      );
    //Mock for WFA Storage Group Delete Job
    nock('http://wfatestportal.com')
        .post('/sgDelete/jobs')
       	.reply(200, {
       			          "job":{
    	  				            "$":{
      					                   "xmlns:atom":"http://www.w3.org/2005/Atom",
    	  					                 "jobId":"65390"
      				                  }
      			                }
        		        }
     		      );
    //Mock for WFA Storage Group Delete Status Job
    nock('http://wfatestportal.com')
        .get('/sgDelete/jobs/65390')
       	.reply(200, {
                       "job":{
                             "jobStatus": [{"jobStatus":['COMPLETED'], "phase":[]}]
                             }
        		        }
     		      );

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
              subtenant1.tenant = mongoose.Types.ObjectId(tenant1._id);
              subtenant2.tenant = mongoose.Types.ObjectId(tenant2._id);
              subtenant1.save(function (errSubtenant) {
                should.not.exist(errSubtenant);
                subtenant2.save(function (errSubtenant) {
                  should.not.exist(errSubtenant);
                  site.save(function(errSite) {
                    should.not.exist(errSite);
                    subscription1.site = site;
                    subscription2.site = site;
                    subscription1.tenant = tenant1;
                    subscription1.partner = partnerTenant;
                    subscription2.tenant = tenant2;
                    subscription1.save(function(err) {
                      should.not.exist(err);
                      subscription2.save(function(err) {
                        should.not.exist(err);                      
                        server1.subtenant = mongoose.Types.ObjectId(subtenant1._id);
                        server2.subtenant = mongoose.Types.ObjectId(subtenant2._id);
                        server1.site = server2.site = mongoose.Types.ObjectId(site._id);
                        server1.subscription = mongoose.Types.ObjectId(subscription1._id);
                        server2.subscription = mongoose.Types.ObjectId(subscription2._id);
                        server1.save(function(errServer) {
                          should.not.exist(errServer);
                          server2.save(function(errServer) {
                            should.not.exist(errServer);  
                            storagegroup1.server = server1;
                            storagegroup2.server = server2;
                            storagegroup1.save(function(err) {
                              should.not.exist(err);
                              storagegroup2.save(function(err) {
                                should.not.exist(err);                       
                                storagegroup = {
                                  name: 'Test Storage',
                                  code: 'testcode',
                                  tier: 'standard',
                                  snapshotPolicy: '7daily1810',
                                  serverId : mongoose.Types.ObjectId(server1._id)
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
          });
        });
      });
    });
  });

  /////////////////////////////// create //////////////////////////////////

  it('should be able to save a storagegroup if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {

        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new storagegroup
        agent.post('/api/storagegroups')
          .send(storagegroup)
          .expect(200)
          .end(function (strGrpSaveErr, strGrpSaveRes) {
            // Handle storagegroup save error
            if (strGrpSaveErr) {
              return done(strGrpSaveErr);
            }
            (strGrpSaveRes.body.name).should.equal(storagegroup.name);
            done();
          });
      });
  });

  it('should not be able to save a storagegroup if not logged in', function (done) {
    //Trying to create a storagegroup should fail with unauthorised access
    agent.post('/api/storagegroups')
      .send(storagegroup)
      .expect(401)
      .end(function (strGrpSaveErr, strGrpSaveRes) {
        done(strGrpSaveErr);
      });
  });

  it('should go to Contact Support while saving a storagegroup if WFA is down', function (done) {
    this.timeout(18000);
    //Setting an invalid WFA URL to fail the create and make it move to Contact Support
    nock.cleanAll();

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {

        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new storagegroup
        agent.post('/api/storagegroups')
          .send(storagegroup)
          .expect(200)
          .end(function (strGrpSaveErr, strGrpSaveRes) {
            // Handle storagegroup save error
            if (strGrpSaveErr) {
              return done(strGrpSaveErr);
            }
            (strGrpSaveRes.body.status).should.equal('Creating');

            setTimeout(function(){
              agent.get('/api/storagegroups/'+strGrpSaveRes.body.storagegroupId)
                .expect(200)
                .end(function (strGrpGetErr, strGrpGetRes) {
                  // Handle storagegroup get error
                  if (strGrpGetErr) {
                    return done(strGrpGetErr);
                  }
                  (strGrpGetRes.body.status).should.equal('Contact Support');
                  config.wfa.sgCreateJob = 'http://wfatestportal.com/sgCreate/jobs';
                  done();
                });
            },7000);
          });
      });
  });

  it('should not be able to update a storagegroup if not authorized in', function (done) {
  
    agent.post('/api/auth/signin')
      .send(credentialsRead)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
  
        // Save a new storagegroup
        agent.post('/api/storagegroups')
          .send(storagegroup)
          .expect(403)
          .end(function (strGrpSaveErr, strGrpSaveRes) {            
            done();
          });
      });
  });
  
  // it('should not be able to read a storagegroup if not logged in', function (done) {
  //
  //   var storagegroupId;
  //   //Log in
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //
  //       // Save a new storagegroup
  //       agent.post('/api/storagegroups')
  //         .send(storagegroup)
  //         .expect(200)
  //         .end(function (strGrpSaveErr, strGrpSaveRes) {
  //           // Handle storagegroup save error
  //           if (strGrpSaveErr) {
  //             return done(strGrpSaveErr);
  //           }
  //           storagegroupId = strGrpSaveRes.body.storagegroupId;
  //           (strGrpSaveRes.body.name).should.equal(storagegroup.name);
  //         });
  //         done();
  //     });
  //
  //     //Logout and try to read the same
  //     agent.get('api/auth/signout')
  //       .end(function(){
  //         //Trying to read a storagegroup should fail with unauthorised access
  //         agent.get('/api/storagegroups/'+storagegroupId)
  //           .send(storagegroup)
  //           .expect(401)
  //           .end(function (strGrpReadErr, strGrpReadRes) {
  //             done(strGrpReadErr);
  //           });
  //       });
  // });
  //
  // it('should not be able to delete a storagegroup if not logged in', function (done) {
  //   var storagegroupId;
  //   //Save a storagegroup
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
  //
  //       // Save a new storagegroup
  //       agent.post('/api/storagegroups')
  //         .send(storagegroup)
  //         .expect(200)
  //         .end(function (strGrpSaveErr, strGrpSaveRes) {
  //           // Handle storagegroup save error
  //           if (strGrpSaveErr) {
  //             return done(strGrpSaveErr);
  //           }
  //           storagegroupId = strGrpSaveRes.body.storagegroupId;
  //           (strGrpSaveRes.body.name).should.equal(storagegroup.name);
  //         });
  //         done();
  //     });
  //     //Logout and try to read the same
  //     agent.get('api/auth/signout')
  //       .end(function(){
  //         //Trying to delete a storagegroup should fail with unauthorised access
  //         agent.delete('/api/storagegroups/'+storagegroupId)
  //           .send(storagegroup)
  //           .expect(401)
  //           .end(function (strGrpDeleteErr, strGrpDeleteRes) {
  //             // Call the assertion callback
  //             done(strGrpDeleteErr);
  //           });
  //   });
  // });

  it('should not be able to save a storagegroup if no name is provided', function (done) {
    // Invalidate name field
    storagegroup.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new storage group
        agent.post('/api/storagegroups')
          .send(storagegroup)
          .expect(400)
          .end(function (strGrpSaveErr, strGrpSaveRes) {
            // Set message assertion for name is a required field
            should.exist(strGrpSaveRes.body.message.name);
            (strGrpSaveRes.body.message.name).should.match('Storage Group name required');

            // Handle storagegroup save error
            done(strGrpSaveErr);
          });
      });
  });

  /////////////////////////////// update ///////////////////////////////////

  it('should be able to update a storagegroup if signed in', function (done) {
    this.timeout(12000);
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new storagegroup
        agent.post('/api/storagegroups')
          .send(storagegroup)
          .expect(200)
          .end(function (strGrpSaveErr, strGrpSaveRes) {
            // Handle storagegroup save error
            if (strGrpSaveErr) {
              return done(strGrpSaveErr);
            }

            //SetTImeout for the update to happen and storagegroup in Operational Status
            setTimeout(function(){
              storagegroup.name = 'newname';
              // Update an existing storagegroup
              agent.put('/api/storagegroups/' + strGrpSaveRes.body.storagegroupId)
                .send(storagegroup)
                .expect(200)
                .end(function (strGrpUpdateErr, strGrpUpdateRes) {
                  // Handle storagegroup upate error
                  if (strGrpUpdateErr) {
                    return done(strGrpUpdateErr);
                  }

                  // Set assertions for the name and status
                  (strGrpUpdateRes.body.storagegroupId).should.equal(strGrpSaveRes.body.storagegroupId);
                  (strGrpUpdateRes.body.name).should.match('newname');
                  (strGrpUpdateRes.body.status).should.match('Operational');

                  // Call the assertion callback
                  done();
                });
              },8000);
          });
      });
  });

  it('should not be able to update a storagegroup if signed in & Status is not Operational', function (done) {

    //Give an invalid WFA URL to fail the create and make it move to Contact Support
    config.wfa.sgCreateJob = 'http://wfatestportal.com/sgCreate/failjobs';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new storagegroup
        agent.post('/api/storagegroups')
          .send(storagegroup)
          .expect(200)
          .end(function (strGrpSaveErr, strGrpSaveRes) {
            // Handle storagegroup save error
            if (strGrpSaveErr) {
              return done(strGrpSaveErr);
            }

            // Update an storagegroup which is in contactSupport
            agent.put('/api/storagegroups/' + strGrpSaveRes.body.storagegroupId)
              .send(storagegroup)
              .expect(400)
              .end(function (strGrpUpdateErr, strGrpUpdateRes) {
                // Handle storagegroup upate error
                if (strGrpUpdateErr) {
                  return done(strGrpUpdateErr);
                }
                // Set message assertion for status
                should.exist(strGrpUpdateRes.body.message);
                (strGrpUpdateRes.body.message).should.match('Storage Group is currently undergoing a different operation. Please wait until Status = Operational');
                //Reverting to Original
                config.wfa.sgCreateJob = 'http://wfatestportal.com/sgCreate/jobs';
                // Call the assertion callback
                done();
              });
          });
      });
  });

  //////////////////////////////// delete ////////////////////////////////

  it('should be able to delete a storagegroup if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        var storageGroupObj = new Storagegroup(storagegroup);
        storageGroupObj.status = 'Operational';
        storageGroupObj.server = storagegroup.serverId;
        storageGroupObj.user = user;

        // Save a new storagegroup
        storageGroupObj.save(function(err) {
          should.not.exist(err);
          // Delete an existing storagegroup
          agent.delete('/api/storagegroups/' + storageGroupObj._id)
            .expect(200)
            .end(function (strGrpDeleteErr, strGrpDeleteRes) {
              // Handle storagegroup error
              if (strGrpDeleteErr) {
                return done(strGrpDeleteErr);
              }
              //Should be en empty response
              (strGrpDeleteRes.body).should.be.empty();
              // Call the assertion callback
              done();
            });
        });
      });
  });

  it('should not be able to delete a storagegroup if signed in, but has storage unit dependancy', function (done) {
    this.timeout(10000);
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new storagegroup
        agent.post('/api/storagegroups')
          .send(storagegroup)
          .expect(200)
          .end(function (strGrpSaveErr, strGrpSaveRes) {
            // Handle storagegroup save error
            if (strGrpSaveErr) {
              return done(strGrpSaveErr);
            }
            setTimeout(function(){
              var dependantStorageUnit = new Storageunit({
                name: 'storage unit name',
                code: 'storagecode',
                protocol: 'nfs',
                sizegb: '344',
                server: mongoose.Types.ObjectId(server1._id),
                storagegroup: mongoose.Types.ObjectId(strGrpSaveRes.body.storagegroupId)
              });

              dependantStorageUnit.save(function (err) {
                should.not.exists(err);
                // Delete an existing storagegroup
                agent.delete('/api/storagegroups/' + strGrpSaveRes.body.storagegroupId)
                  .send(storagegroup)
                  .expect(400)
                  .end(function (strGrpDeleteErr, strGrpDeleteRes) {
                    // Handle storagegroup error
                    if (strGrpDeleteErr) {
                      return done(strGrpDeleteErr);
                    }

                    // Set assertions
                    (strGrpDeleteRes.body.message).should.equal('Can\'t perform Delete: Please ensure all associated Storage Units are deleted');

                    // Call the assertion callback
                    done();
                  });
              });
            },3000);
          });
      });
  });

  /////////////////////////////////// list storagegroup /////////////////////////
  it('should be able to list storagegroups on basis of server spcified in query parameters if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {

        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        var storageGroupObj = new Storagegroup(storagegroup);
        storageGroupObj.status = 'Operational';
        storageGroupObj.server = storagegroup.serverId;
        storageGroupObj.user = user;

        // Save a new storagegroup
        storageGroupObj.save(function(err) {
          should.not.exist(err);

        // Save a new storagegroup
        agent.get('/api/storagegroups?server='+server1._id)
          .expect(200)
          .end(function (strGrpListErr, strGrpListRes) {
            // Handle storagegroup save error
            if (strGrpListErr) {
              return done(strGrpListErr);
            }
            var storagegroupList = strGrpListRes.body;
            (storagegroupList[1].name).should.equal(storagegroup.name);
            storageGroupObj.remove();
            done();
          });
        });
      });
  });

  it('should be able to thorw an error in list storagegroups if invalid server spcified in query parameters if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {

        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        var storageGroupObj = new Storagegroup(storagegroup);
        storageGroupObj.status = 'Operational';
        storageGroupObj.server = storagegroup.serverId;
        storageGroupObj.user = user;

        // Save a new storagegroup
        storageGroupObj.save(function(err) {
          should.not.exist(err);

        // Save a new storagegroup
        agent.get('/api/storagegroups?server=test')
          .expect(400)
          .end(function (strGrpListErr, strGrpListRes) {
            // Handle storagegroup save error
            if (strGrpListErr) {
              return done(strGrpListErr);
            }
            (strGrpListRes.body.message).should.equal('Invalid server Id');
            storageGroupObj.remove();
            done();
          });
        });
      });
  });

  it('should not be able to get an storagegroup if signed in and authorized with read user of other tenant', function (done) {
    // login with the read user
    agent.post('/api/auth/signin')
    .send(credentialsRead)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get an existing icr
      agent.get('/api/storagegroups/' + storagegroup2._id)
        .expect(403)
        .end(function (storagegroupErr, storagegroupRes) {          
          done();
        });
    });
  });

  if(_.includes(featuresSettings.roles.storagegroup.read, 'partner')){
    it('should be able to get the storagegroup under his partnership if signed in with partner', function (done) {
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
            // Get a list of storagegroups
            agent.get('/api/storagegroups/'+storagegroup1._id)
              .expect(200)
              .end(function (storagegroupGetErr, storagegroupGetRes) {
                // Handle storagegroup save error
                if (storagegroupGetErr) {
                  return done(storagegroupGetErr);
                }
                // Get storagegroups list
                var storagegroup = storagegroupGetRes.body;

                // Set assertions
                (storagegroup.name).should.equal(storagegroup1.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to get the storagegroup which is not under his partnership if signed in with partner', function (done) {
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
            // Get a list of storagegroups
            agent.get('/api/storagegroups/'+storagegroup2._id)
              .expect(403)
              .end(function (storagegroupsGetErr, storagegroupsGetRes) {                
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.storagegroup.list, 'partner')){
    it('should be able to list the storagegroups under his partnership if signed in with partner', function (done) {
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
            // Get a list of storagegroups
            agent.get('/api/storagegroups')
              .expect(200)
              .end(function (storagegroupsGetErr, storagegroupsGetRes) {
                // Handle storagegroup save error
                if (storagegroupsGetErr) {
                  return done(storagegroupsGetErr);
                }
                // Get storagegroups list
                var storagegroups = storagegroupsGetRes.body;

                // Set assertions
                (storagegroups[0].name).should.equal(storagegroup1.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to list the storagegroups which are not under his partnership if signed in with partner', function (done) {
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
            // Get a list of storagegroups
            agent.get('/api/storagegroups')
              .expect(200)
              .end(function (storagegroupsGetErr, storagegroupsGetRes) {
                // Handle storagegroup save error
                if (storagegroupsGetErr) {
                  return done(storagegroupsGetErr);
                }
                // Get storagegroups list
                var storagegroups = storagegroupsGetRes.body;

                // Set assertions
                (storagegroups[0].name).should.not.be.equal(storagegroup2.name);
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.storagegroup.update,'partner')){
    it('should be able to update a storagegroup under his partnership if signed in with partner', function (done) {
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
            storagegroup1.name = "testing1";
            // Get a list of storagegroups
            agent.put('/api/storagegroups/'+storagegroup1._id)
              .send(storagegroup1)
              //.expect(200)
              .end(function (storagegroupsGetErr, storagegroupsGetRes) {
                // Handle storagegroup save error
                if (storagegroupsGetErr) {
                  return done(storagegroupsGetErr);
                }
                // Get storagegroups list
                var storagegroups = storagegroupsGetRes.body;
                console.log(storagegroups);

                // Set assertions
                (storagegroups.name).should.match('testing1');

                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to update a storagegroup not under his partnership if signed in with partner', function (done) {
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
            storagegroup2.name = "testing1";
            // Get a list of storagegroups
            agent.put('/api/storagegroups/'+storagegroup2._id)
              .send(storagegroup2)
              .expect(403)
              .end(function (storagegroupsGetErr, storagegroupsGetRes) {
                // Handle storagegroup save error
                if (storagegroupsGetErr) {
                  return done(storagegroupsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });
  }

  if(_.includes(featuresSettings.roles.storagegroup.delete,'partner')){
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
            // Get a list of storagegroups
            agent.delete('/api/storagegroups/'+storagegroup1._id)
              .expect(200)
              .end(function (storagegroupsGetErr, storagegroupsGetRes) {
                // Handle storagegroup save error
                if (storagegroupsGetErr) {
                  return done(storagegroupsGetErr);
                }
                // Call the assertion callback
                done();
              });
          });
      });
    });

    it('should not be able to delete a storagegroup not under his partnership if signed in with partner', function (done) {
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
            // Get a list of storagegroups
            agent.put('/api/storagegroups/'+storagegroup2._id)
              .expect(403)
              .end(function (storagegroupsGetErr, storagegroupsGetRes) {
                // Handle storagegroup save error
                if (storagegroupsGetErr) {
                  return done(storagegroupsGetErr);
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
      Subtenant.remove().exec(function(){
        Tenant.remove().exec(function () {
          Site.remove().exec(function(){
            Subscription.remove().exec(function() {
              Server.remove().exec(function(){
                nock.cleanAll();
                Storagegroup.remove().exec(done);
              });
            });
          });
        });
      });
    });
  });
});
