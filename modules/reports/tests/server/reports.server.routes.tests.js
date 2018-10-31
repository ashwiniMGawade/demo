'use strict';

var should = require('should'),
  request = require('supertest'),
  fs = require('fs'),
  rmdir = require('rmdir'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  express = require(path.resolve('./config/lib/express')),
  config = require(path.resolve('./config/config'));

  var dir = config.reports.storage_path;

/**
 * Globals
 */
var app, agent, credentials1, credentials2, user1, user2, tenant2, tenant1;


/**
 * Tenant routes tests
 */
describe('Reports routes testcases', function () {


  if (!fs.existsSync(dir)) {
    console.log("mkdir")
    fs.mkdirSync(dir);
  }

  if (!fs.existsSync(dir + 'a12345/')) {
    fs.mkdirSync(dir + 'a12345/');
  }

  fs.writeFile(dir + 'a12345/' + 'dfaasreport_a12345_20160403.csv', '', function () {

  });

  fs.writeFile(dir + 'a12345/' + 'dfaasreport_a12345_20160403.ods', '', function () {

  });

  before(function (done) {
    // Get application
    app = express.init(mongoose.connection.db);
    agent = request.agent(app);
    done();
  });

  beforeEach(function (done) {


    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    if (!fs.existsSync(dir + 'a12345/')) {
      fs.mkdirSync(dir + 'a12345/');
    }

    fs.writeFile(dir + 'a12345/' + 'dfaasreport_a12345_20160403.csv', '', function () {

    });

    fs.writeFile(dir + 'a12345/' + 'dfaasreport_a12345_20160403.pdf', '', function () {

    });
    // Create user credentials
    credentials1 = {
      username: 'dfaastester',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    credentials2 = {
      username: 'dfaastesterr',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user1 = new User({
      firstName: 'DFAAS',
      lastName: 'Tester',
      displayName: 'DFAAS Tester',
      email: 'dfaastester@test.com',
      username: credentials1.username,
      password: credentials1.password,
      provider:'local',
      roles:['admin']
    });


    user2 = new User({
      firstName: 'DFAAS',
      lastName: 'Tester',
      displayName: 'DFAAS Tester',
      email: 'dfaastesterr@test.com',
      username: credentials2.username,
      password: credentials2.password,
      provider:'local',
      roles:['admin']
    });

    var curDate = new Date();        
    curDate.setDate(curDate.getDate()-8);

    tenant1 = new Tenant({
      code:'a12345',
      name:'testTenant1',
      created: curDate
    });

    tenant2 = new Tenant({
      code:'a123456',
      name:'testTenant2',
      created: curDate
    });

    
    // Save a user to the test db and create new tenant
    tenant1.save(function (err) {
      Tenant.findById(tenant1._id).exec(function (err, tenant) {
        user1.tenant = mongoose.Types.ObjectId(tenant1._id);
        user1.save(function (err) {
          tenant2.save(function (errtenant, tenant) {
            should.not.exist(errtenant);
            user2.tenant = mongoose.Types.ObjectId(tenant2._id);
            user2.save(function (err) {            
              should.not.exist(err);
              tenant = {
                name: 'Test Tenant',
                code: 'a1234'
              };
              done();
            });            
          });
        });
      });
    });

  });

  it('should not be able to get the list of reports if not logged in', function (done) {
    agent.get('/api/reports?tenant='+tenant1._id)
      .expect(401)
      .end(function (err, res) {
        // Call the assertion callback
        done(err);
      });

  });

  it('should be able to get the report list if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // get report list
        agent.get('/api/reports?tenant='+tenant1._id)
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            // Handle err
            if (err) {
              done(err);
            }

            // Get report
            var reports = res.body;
            reports.should.be.instanceof(Array).and.have.lengthOf(2);
            done();
          });
      });
  });

  it('should be able to get the error if logged in but invalid tenant id is specified, ', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // get report list
        agent.get('/api/reports?tenant=232323')
          .set('Accept', 'application/json')
          .expect(400)
          .end(function (err, res) {
            // Handle err
            if (err) {
              done(err);
            }
            res.body.message.should.be.equal('Invalid Tenant ID');
            done();
          });
      });
  });


  it('should not be able to get the report list if logged in tenant is not specified', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // get report list
        agent.get('/api/reports')
          .set('Accept', 'application/json')
          .expect(400)
          .end(function (err, res) {

            done(err);
          });
      });
  });
  
  it('should not be able to get the report list if logged in enddate < startdate and report is not generated', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        var curDate = new Date();        
        curDate.setDate(curDate.getDate()+1);
        var month = ("0" + (curDate.getMonth())).slice(-2);
        var date = ("0" + (curDate.getDate())).slice(-2);
        
        var startDate = curDate.getFullYear().toString()+month+date;
        var endDate = curDate.getFullYear().toString()+month+("0" + (parseInt(date)-1)).slice(-2);

        // get report list
        agent.get('/api/reports/?tenant='+tenant1._id+'&start='+startDate+'&end='+endDate)
          .set('Accept', 'application/json')
          .expect(400)
          .end(function (err, res) {    
            (res.body.message).should.equal('End date should be greater than or equal to start date');    
            done(err);
          });
      });
  });

  // it('should not be able to get the report list if logged in but reports are not yet generated', function (done) {
  //   agent.post('/api/auth/signin')
  //     .send(credentials1)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         done(signinErr);
  //       } 
       
  //       var curDate = new Date();
  //       curDate.setDate(curDate.getDate()-1);
  //       var month = ("0" + (curDate.getMonth()+1)).slice(-2);
  //       var date = ("0" + (curDate.getDate())).slice(-2);
  //       var date1 = ("0" + (curDate.getDate() + 4)).slice(-2);
        
  //       var startDate = curDate.getFullYear().toString()+month+date;
  //       var endDate = curDate.getFullYear().toString()+month+date;

  //       // get report list
  //       agent.get('/api/reports/?tenant='+tenant1._id+'&start='+startDate+'&end='+endDate)
  //         .set('Accept', 'application/json')
  //         .expect(400)
  //         .end(function (err, res) { 
  //           //(res.body.message).should.equal('Report is not yet generated.');  
  //           done(err);
  //         });
  //       });       
      
  // });

  it('should not be able to get the report list if logged in but tenant is just created', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        } 

        tenant1.created = Date.now();
        tenant1.save(function(err) {
           var curDate = new Date();
          curDate.setDate(curDate.getDate()-2);
          var month = ("0" + (curDate.getMonth()+1)).slice(-2);
          var date = ("0" + (curDate.getDate())).slice(-2);
          var date1 = ("0" + (curDate.getDate() + 4)).slice(-2);
          
          var startDate = curDate.getFullYear().toString()+month+date;
          var endDate = curDate.getFullYear().toString()+month+date;

          // get report list
          agent.get('/api/reports/?tenant='+tenant1._id+'&start='+startDate+'&end='+endDate)
            .set('Accept', 'application/json')
            .expect(400)
            .end(function (err, res) { 
              (res.body.message).should.equal('Tenant not yet created');  
              done(err);
            });
        });  
      });  
      
  });

  it('should not be able to get the report list if logged in but tenanancy condition is not met', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials2)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        } 
        var curDate = new Date();
        curDate.setDate(curDate.getDate()-2);
        var month = ("0" + (curDate.getMonth()+1)).slice(-2);
        var date = ("0" + (curDate.getDate())).slice(-2);
        var date1 = ("0" + (curDate.getDate() + 4)).slice(-2);
        
        var startDate = curDate.getFullYear().toString()+month+date;
        var endDate = curDate.getFullYear().toString()+month+date;

        // get report list
        agent.get('/api/reports/?tenant='+tenant1._id+'&start='+startDate+'&end='+endDate)
          .set('Accept', 'application/json')
          .expect(403)
          .end(function (err, res) { 
            (res.body.message).should.equal('User is not authorized');  
            done(err);
          });
          
      });  
      
  });

  it('should not be able to get the report list if logged in start date is more than yesterday', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        } 
        var curDate = new Date();
        curDate.setDate(curDate.getDate());
        var month = ("0" + (curDate.getMonth()+1)).slice(-2);
        var date = ("0" + (curDate.getDate()+2)).slice(-2);
        var date1 = ("0" + (curDate.getDate() + 4)).slice(-2);
        
        var startDate = curDate.getFullYear().toString()+month+date;
        var endDate = curDate.getFullYear().toString()+month+date;

        // get report list
        agent.get('/api/reports/?tenant='+tenant1._id+'&start='+startDate+'&end='+endDate)
          .set('Accept', 'application/json')
          .expect(400)
          .end(function (err, res) { 
            (res.body.message).should.equal('Start Date must be yesterday or before');  
            done(err);
          });
          
      });  
      
  });

  it('should not be able to get the report list if logged in but reports are not found', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        } 
       
        var curDate = new Date();
        curDate.setDate(curDate.getDate()-2);
        var month = ("0" + (curDate.getMonth()+1)).slice(-2);
        var date = ("0" + (curDate.getDate())).slice(-2);
        
        var startDate = curDate.getFullYear().toString()+month+date;
        var endDate = curDate.getFullYear().toString()+month+date;
        console.log(endDate);

        // get report list
        agent.get('/api/reports/?tenant='+tenant1._id+'&start='+startDate+'&end='+endDate)
          .set('Accept', 'application/json')
          .expect(500)
          .end(function (err, res) { 
            (res.body.message).should.equal('Unknown Error');  
            done(err);
          });
        });       
      
  });

  
  it('should not be able to download the report if not logged in', function (done) {
    agent.get('/api/reports/dfaasreport_tls_20160401.ods')
      .expect(401)
      .end(function (err, res) {
        // Call the assertion callback
        done(err);
      });

  });

  it('should not be able to download the report if logged in but not authorized user', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // get report
        agent.get('/api/reports/dfaasreport_tls_20160401.ods')
          .set('Accept', 'application/json')
          .expect(403)
          .end(function (err, res) {
            // Handle err
            (res.body.message).should.match('User is not authorized');
            done(err);
          });
      });
  });

  it('should not be able to download the report if logged in and authorized user but file not found', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        // get report list
        agent.get('/api/reports/dfaasreport_a12345_20160441.ods')
          .expect(404)
          .end(function (err, res) {
            // Handle err
            done(err);
          });
      });
  });


  it('should not be able to download the report if logged in and not authorized as tenant id is different', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        // get report list
        agent.get('/api/reports/dfaasreport_12344_20160403.csv')
          .expect(403)
          .end(function (err, res) {
            // Handle err
            (res.body.message).should.match('User is not authorized');
            done(err);
          });
      });
  });

  it('should not be able to download the report if logged in and authorized but file name is invalid', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        // get report list
        agent.get('/api/reports/dfaasreport_20160403.pdf')
          .expect(400)
          .end(function (err, res) {
            console.log(err);
            // Handle err
            (res.body.message).should.match('Invalid file format');
            done(err);
          });
      });
  });

  it('should not be able to download the report if logged in and authorized but file name is invalid', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        // get report list
        agent.get('/api/reports/dfassreport_123_20160403.pdf')
          .expect(400)
          .end(function (err, res) {
            console.log(err);
            // Handle err
            (res.body.message).should.match('Invalid file format');
            done(err);
          });
      });
  });

  it('should be able to download the report if logged in and authorized as tenant id is same', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials1)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }
        // get report list
        agent.get('/api/reports/dfaasreport_a12345_20160403.csv')
          .expect(200)
          .end(function (err, res) {
            // Handle err
            (res.headers['content-disposition']).should.match('attachment; filename=dfaasreport_a12345_20160403.csv');
            (res.headers['transfer-encoding']).should.match('chunked');
            done();
          });
      });
  });


  
  afterEach(function (done) {
    User.remove().exec(function() {     
      Tenant.remove().exec(function() {       
        rmdir('reports/a12345', function (err, dirs, files) {
          done();
        }); 
      });
    });
  });
});
