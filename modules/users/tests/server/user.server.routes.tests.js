'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Tenant = mongoose.model('Tenant'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, _user, credentialspartner, userpartner, _userpartner, admin;
var _partnerTenant, _tenant, _userRoot, userRoot, credentialsroot;

/**
 * User routes tests
 */
describe('User CRUD tests', function () {

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

    credentialspartner = {
      username: 'usernamepartner',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    credentialsroot = {
      username: 'rootuser',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    _user = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'tesat@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      phone: 12312312312
    };

    // Create a new user
    _userRoot = {
      firstName: 'root',
      lastName: 'user',
      displayName: 'root user',
      email: 'rootuser@test.com',
      username: credentialsroot.username,
      password: credentialsroot.password,
      provider: 'local',
      phone: 12312312312,
      roles: ['root'],
    };

    // Create a new user
    _userpartner = {
      firstName: 'Full',
      lastName: 'Partner',
      displayName: 'Full Partner',
      email: 'partner@test.com',
      username: credentialspartner.username,
      password: credentialspartner.password,
      provider: 'local',
      roles: ['partner'],
      phone: 12312392312
    };

    user = new User(_user);
    userRoot = new User(_userRoot);
    userpartner = new User(_userpartner);

    _tenant = new Tenant({
      code:'a123445',
      name:'testTenant1'
    });

    _partnerTenant = new Tenant({
      code:'partcode',
      name:'partnerTenant'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      _tenant.annotation = 'test';
      _partnerTenant.annotation = 'test';
    }

    // Save a user to the test db and create new User
    userRoot.save(function(err){
      _partnerTenant.save(function(err){
        userpartner.tenant = _partnerTenant;
        userpartner.save(function (err) {
          should.not.exist(err);
          _tenant.partner = _partnerTenant;
          _tenant.save(function (err) {
            should.not.exist(err);
            user.tenant = mongoose.Types.ObjectId(_tenant._id);
            user.save(function (err) {
              should.not.exist(err);
              userRoot.save(function (err) {
                should.not.exist(err);
                done();
              });
            });
          });
        });
      });
    });

  });

  it('should be able to login successfully and logout successfully', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Logout
        agent.get('/api/auth/signout')
          .expect(302)
          .end(function (signoutErr, signoutRes) {
            if (signoutErr) {
              return done(signoutErr);
            }

            signoutRes.redirect.should.equal(true);

            // NodeJS v4 changed the status code representation so we must check
            // before asserting, to be comptabile with all node versions.
           //if (process.version.indexOf('v4') === 0) {
              signoutRes.text.should.equal('Found. Redirecting to /');
            //} else {
              //signoutRes.text.should.equal('Moved Temporarily. Redirecting to /');
            //}

            return done();
          });
      });
  });

  it('should be able to list of all type of users if root', function (done) {
    agent.post('/api/auth/signin')
      .send(credentialsroot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Request list of users
        agent.get('/api/users')
          .expect(200)
          .end(function (usersGetErr, usersGetRes) {
            if (usersGetErr) {
              return done(usersGetErr);
            }
            var users = usersGetRes.body;
            (users.length).should.match(3); //All users listed
            return done();
          });
      });
  });

  it('should be able to list of all users under his tenancy if user', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Request list of users
        agent.get('/api/users')
          .expect(200)
          .end(function (usersGetErr, usersGetRes) {
            if (usersGetErr) {
              return done(usersGetErr);
            }
            var users = usersGetRes.body;
            (users.length).should.match(1); //All users listed
            return done();
          });
      });
  });

  it('should be able to retrieve a list of users (except root users) only under his partnership if partner', function (done) {
    agent.post('/api/auth/signin')
      .send(credentialspartner)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Request list of users
        agent.get('/api/users')
          .expect(200)
          .end(function (usersGetErr, usersGetRes) {
            if (usersGetErr) {
              return done(usersGetErr);
            }
            usersGetRes.body.should.be.instanceof(Array).and.have.lengthOf(2);
            // Call the assertion callback
            return done();
          });
      });
  });

  it('should be able to retrieve a list of users excluding root if partner', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Request list of users
      agent.get('/api/users')
      .expect(200)
      .end(function (usersGetErr, usersGetRes) {
        if (usersGetErr) {
          return done(usersGetErr);
        }

        usersGetRes.body.should.be.instanceof(Array).and.have.lengthOf(2);

        // Call the assertion callback
        return done();
      });
    });
  });


  it('should be able to get a single user details if admin', function (done) {
    user.roles = ['admin'];

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

          // Get single user information from the database
          agent.get('/api/users/' + user._id)
            .expect(200)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.should.be.instanceof(Object);
              userInfoRes.body.userId.should.be.equal(String(user._id));

              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should be able to update a single user details if admin', function (done) {
    user.roles = ['admin'];

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

          // Get single user information from the database

          var userUpdate = {
            firstName: 'admin-update-first',
            lastName: 'adminupdatelast',
            roles: ['admin'],
            phone: 454545454454,
            email: 'testa@test.com',
            username: 'testass',
            password: credentials.password
          };

          agent.put('/api/users/' + user._id)
            .send(userUpdate)
            //.expect(200)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.should.be.instanceof(Object);
              userInfoRes.body.firstName.should.be.equal('admin-update-first');
              userInfoRes.body.lastName.should.be.equal('adminupdatelast');
              userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);
              userInfoRes.body.userId.should.be.equal(String(user._id));

              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should be able to update a single user details if admin', function (done) {
    user.roles = ['admin'];
    user.password = credentials.password;

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

          // Get single user information from the database

          var userUpdate = {
            firstName: 'adminupdatefirst',
            lastName: 'adminupdatelast',
            roles: ['admin'],
            phone: 454545454454,
            email: 'testa@test.com',
            username: 'testass',
            tenatId: _tenant._id
          };

          agent.put('/api/users/' + user._id)
            .send(userUpdate)
            .expect(200)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.should.be.instanceof(Object);
              userInfoRes.body.firstName.should.be.equal('adminupdatefirst');
              userInfoRes.body.lastName.should.be.equal('adminupdatelast');
              userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);
              userInfoRes.body.userId.should.be.equal(String(user._id));

              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should be able to update own details for terms and coditions if logged in', function (done) {
    user.roles = ['admin'];
    user.password = credentials.password;

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

          // Get single user information from the database

          var userUpdate = {
            acceptTC:true
          };

          agent.put('/api/users/' + user._id)
            .send(userUpdate)
            .expect(200)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.should.be.instanceof(Object);
              userInfoRes.body.acceptTC.should.be.equal(true);
              userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);
              userInfoRes.body.userId.should.be.equal(String(user._id));

              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should not be able to update single user details if admin and roles are more than one', function (done) {
    user.roles = ['admin'];
    user.password = credentials.password;

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

          // Get single user information from the database

          var userUpdate = {
            roles: ['admin', 'read']
          };

          agent.put('/api/users/' + user._id)
            .send(userUpdate)
            .expect(400)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.should.be.instanceof(Object);
              userInfoRes.body.message.should.be.equal('Invalid value for roles field');

              // Call the assertion callback
              return done();
            });
        });
    });
  });


  it('should not be able to update a single user details of if read', function (done) {
    user.roles = ['read'];
    user.password = credentials.password;

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

          // Get single user information from the database

          var userUpdate = {
            firstName: 'adminupdatefirst',
            lastName: 'adminupdatelast',
            roles: 'read',
            phone: 454545454454,
            email: 'testa@test.com',
            username: 'testass',
            tenantId: _tenant._id
          };

          agent.put('/api/users/' + user._id)
            .send(userUpdate)
            //.expect(400)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.message.should.be.equal('User is not authorized');

              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should not be able to update a single user details if admin and trying to update the root or partner user', function (done) {
    user.roles = ['admin'];

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

          // Get single user information from the database

          var userUpdate = {
            firstName: 'adminupdatefirst',
            lastName: 'adminupdatelast',
            roles: ['root'],
            phone: 454545454454,
            email: 'testa@test.com',
            username: 'testass',
            password: "Testuser@123"
          };

          agent.put('/api/users/' + user._id)
            .send(userUpdate)
            .expect(400)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.message.should.be.equal('Role could not be change from admin to root');
              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should not be able to update role of root user', function (done) {
    agent.post('/api/auth/signin')
      .send(credentialsroot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get single user information from the database

        var userUpdate = {        
          roles: ['partner']
        };

        agent.put('/api/users/' + userRoot._id)
          .send(userUpdate)
          .expect(200)
          .end(function (userInfoErr, userInfoRes) {
            if (userInfoErr) {
              return done(userInfoErr);
            }

            userInfoRes.body.roles[0].should.be.equal('root');
            // Call the assertion callback
            return done();
          });
      });
  });

   it('should not be able to update role of partner user', function (done) {
    agent.post('/api/auth/signin')
      .send(credentialsroot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get single user information from the database

        var userUpdate = {        
          roles: ['root']
        };

        agent.put('/api/users/' + userpartner._id)
          .send(userUpdate)
          //.expect(200)
          .end(function (userInfoErr, userInfoRes) {
            console.log(userInfoRes.body);
            if (userInfoErr) {
              return done(userInfoErr);
            }

            userInfoRes.body.roles[0].should.be.equal('partner');
            // Call the assertion callback
            return done();
          });
      });
  });

  it('should not be able to create user without roles', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Get single user information from the database

      var userUpdate = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass'
      };

      agent.post('/api/users')
      .send(userUpdate)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }

        userInfoRes.body.message.should.be.equal('Role field is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create user with more than one roles', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Get single user information from the database

      var userUpdate = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['admin', 'read']
      };

      agent.post('/api/users')
      .send(userUpdate)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }

        userInfoRes.body.message.should.be.equal('Invalid value for roles field');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create any user without tenant except root', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Get single user information from the database
      var readUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['admin'],
        provider:'local',
        password:'Qwerty1234%'
      };      
      agent.post('/api/users')
      .send(readUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Tenant field is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create partner user without tenant', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['partner'],
        provider:'local',
        password:'Qwerty1234%'
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }

        userInfoRes.body.message.should.be.equal('Tenant field is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create any user without provider', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var adminUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['admin'],
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(adminUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create partner user without provider', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['partner'],
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create local users by a partner', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['partner'],
        provider : 'local',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(403)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('User is not authorized');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create root users by a partner', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['root'],
        provider : 'raa'
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(403)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('User is not authorized');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create partner users by a partner', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['partner'],
        provider : 'raa',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(403)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('User is not authorized');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create partner users with any provider other than local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['partner'],
        provider : 'raa',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider for Root, Partner & L1-Ops has to be local');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create root users with any provider other than local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['root'],
        provider : 'raa',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider for Root, Partner & L1-Ops has to be local');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create l1ops users with any provider other than local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var l1opsUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['l1ops'],
        provider : 'raa',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(l1opsUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider for Root, Partner & L1-Ops has to be local');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create user without password if provider is local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        username: 'testass',
        roles: ['root'],
        provider : 'local',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Password field is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create user without providerCode if provider is non-local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        roles: ['admin'],
        provider : 'raa',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider Code is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should throw an error when try to create user with Invalid providerCode if provider is non-local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        roles: ['admin'],
        provider : 'raa',
        tenantId: _partnerTenant._id.toString(),
        providerCode: 'as'
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider Code must be 3-256 characters, only alphanumeric, dot, dash, underscore & @ allowed');
        // Call the assertion callback
        return done();
      });
    });
  });


  it('should not be able to create user without username if provider is local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        roles: ['root'],
        provider : 'local',
        password : 'sdfsdfdsAasd',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Username is required.');
        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create root or partner or l1ops user with provider other than local', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialsroot)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }
      // Get single user information from the database
      var partnerUser = {
        firstName: 'admin-first',
        lastName: 'admin-last',
        phone: 454545454454,
        email: 'testa@test.com',
        roles: ['root'],
        provider : 'raa',
        tenantId: _partnerTenant._id.toString()
      };

      agent.post('/api/users')
      .send(partnerUser)
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }
        userInfoRes.body.message.should.be.equal('Provider for Root, Partner & L1-Ops has to be local');
        // Call the assertion callback
        return done();
      });
    });
  });


  it('should be able to create admin user with partner user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Get single user information from the database

      var userUpdate = {
        firstName: 'adminz-first',
        lastName: 'adminz-last',
        phone: 454545454054,
        email: 'adminz@test.com',
        username: 'adminzuser',
        password: '',
        roles: ['admin'],
        provider: 'raa',
        providerCode: 'testcode',
        tenantId: _tenant._id
      };

      agent.post('/api/users')
      .send(userUpdate)
      .expect(200)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }

        userInfoRes.body.should.be.instanceof(Object);
        userInfoRes.body.firstName.should.be.equal('adminz-first');
        userInfoRes.body.lastName.should.be.equal('adminz-last');
        userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);

        // Call the assertion callback
        return done();
      });
    });
  });

  it('should be able to create user user with partner user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Get single user information from the database

      var userUpdate = {
        firstName: 'user-first',
        lastName: 'user-last',
        phone: 454545453454,
        email: 'testb@test.com',
        username: 'testbss',
        roles: ['user'],
        provider:'raa',
        providerCode:'testCode',
        tenantId: _tenant._id
      };

      agent.post('/api/users')
        .send(userUpdate)
        .expect(200)
        .end(function (userInfoErr, userInfoRes) {
          if (userInfoErr) {
            return done(userInfoErr);
          }

          userInfoRes.body.should.be.instanceof(Object);
          userInfoRes.body.firstName.should.be.equal('user-first');
          userInfoRes.body.lastName.should.be.equal('user-last');
          userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          return done();
        });
    });
  });

  it('should be able to create read user with partner user', function (done) {
    agent.post('/api/auth/signin')
    .send(credentialspartner)
    .expect(200)
    .end(function (signinErr, signinRes) {
      // Handle signin error
      if (signinErr) {
        return done(signinErr);
      }

      // Get single user information from the database

      var userUpdate = {
        firstName: 'read-first',
        lastName: 'read-last',
        phone: 454545454254,
        email: 'testc@test.com',
        username: 'testcss',
        roles: ['read'],
        provider:'raa',
        providerCode:'testCode',
        tenantId: _tenant._id
      };

      agent.post('/api/users')
      .send(userUpdate)
      .expect(200)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }

        userInfoRes.body.should.be.instanceof(Object);
        userInfoRes.body.firstName.should.be.equal('read-first');
        userInfoRes.body.lastName.should.be.equal('read-last');
        userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);

        // Call the assertion callback
        return done();
      });
    });
  });

  it('should not be able to create user with read user', function (done) {
    user.roles = ['read'];

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

          // Get single user information from the database

          var userUpdate = {
            firstName: 'admin-first',
            lastName: 'admin-last',
            phone: 454545454454,
            roles:['read'],
            provider:'raa',
            email: 'testa@test.com',
            username: 'testass'
          };

          agent.post('/api/users')
            .send(userUpdate)
            .expect(403)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.message.should.be.equal('User is not authorized');
              // Call the assertion callback
              return done();
            });
        });
    });
  });


  it('should not be able to create user with root or partner role and password is blank', function (done) {
    userRoot.password = credentialsroot.password;

    userRoot.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsroot)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get single user information from the database
          var userCreate = {
            firstName: 'admin-first',
            lastName: 'admin-last',
            phone: 454545454454,
            roles:['root'],
            email: 'testa@test.com',
            username: 'testass',
            password:'',
            provider: 'local'
          };
          agent.post('/api/users')
            .send(userCreate)
            .expect(400)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }
              userInfoRes.body.message.should.be.equal('Password field is required.');
              // Call the assertion callback
              return done();
            });
        });
    });
  });


  it('should not be able to create admin user if user', function (done) {
    user.roles = ['user'];

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

          // Get single user information from the database

          var userUpdate = {
            firstName: 'admin-first',
            lastName: 'admin-last',
            roles: ['admin'],
            provider:'raa',
            phone: 454545454454,
            email: 'testa@test.com',
            username: 'testass'
          };

          agent.post('/api/users')
            .send(userUpdate)
            .expect(403)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.message.should.be.equal('User is not authorized');
              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should be able to create user with roles', function (done) {

    userRoot.password = credentials.password;

    userRoot.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsroot)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get single user information from the database

          var userCreate = {
            firstName: 'root-first',
            lastName: 'root-last',
            phone: 454545454454,
            email: 'roottesta@test.com',
            roles:['root'],
            provider:'local',
            username: 'testass',
            password: credentialsroot.password,
            tenantId: _tenant._id
          };

          agent.post('/api/users')
            .send(userCreate)
            .expect(200)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.should.be.instanceof(Object);
              userInfoRes.body.firstName.should.be.equal('root-first');
              userInfoRes.body.lastName.should.be.equal('root-last');
              userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);
              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should not be able to delete a root or partner user if logged in user is partner', function (done) {
    user.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialspartner)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          //Partner trying to delete partner
          agent.delete('/api/users/' + userpartner._id)
            .expect(403)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }
              userInfoRes.body.message.should.be.equal('User is not authorized');

              //Partner trying to delete root
              agent.delete('/api/users/' + userRoot._id)
                .expect(403)
                .end(function (userInfoErr, userInfoRes) {
                  if (userInfoErr) {
                    return done(userInfoErr);
                  }
                  userInfoRes.body.message.should.be.equal('User is not authorized');
                  return done();
                });
            });
        });
    });
  });

  it('should not be able to delete a single user if admin', function (done) {
    user.roles = ['user', 'admin'];

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

          agent.delete('/api/users/' + user._id)
            //.send(userUpdate)
            .expect(403)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }
              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should be able to delete a single user if root', function (done) {
    agent.post('/api/auth/signin')
      .send(credentialsroot)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.delete('/api/users/' + user._id)
          //.send(userUpdate)
          .expect(200)
          .end(function (userInfoErr, userInfoRes) {
            if (userInfoErr) {
              return done(userInfoErr);
            }
            // Call the assertion callback
            return done();
          });
    });
  });

  it('should be able to change user own password successfully', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Change password
        agent.post('/api/users/password')
          .send({
            newPassword: '1234567890Aa$',
            verifyPassword: '1234567890Aa$',
            currentPassword: credentials.password
          })
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            res.body.message.should.equal('Password changed successfully');
            return done();
          });
      });
  });

  it('should not be able to change user own password if wrong verifyPassword is given', function (done) {
    userRoot.provider = 'local';
    userRoot.password = credentials.password;

    userRoot.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsroot)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }
          // Change password
          agent.post('/api/users/password')
            .send({
              newPassword: '1234567890Aa$',
              verifyPassword: '1234567890-ABC-123-Aa$',
              currentPassword: credentials.password
            })
            .expect(400)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }

              res.body.message.should.equal('Passwords do not match');
              return done();
            });
        });
    });
  });

  it('should not be able to change user own password if wrong currentPassword is given', function (done) {

    userRoot.provider = 'local';
    userRoot.password = credentials.password;

    userRoot.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsroot)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Change password
          agent.post('/api/users/password')
            .send({
              newPassword: '1234567890Aa$',
              verifyPassword: '1234567890Aa$',
              currentPassword: 'some_wrong_passwordAsa$'
            })
            .expect(400)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }

              res.body.message.should.equal('Current password is incorrect');
              return done();
            });
        });
    });
  });

  it('should not be able to change user own password if no new password is at all given', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Change password
        agent.post('/api/users/password')
          .send({
            newPassword: '',
            verifyPassword: '',
            currentPassword: credentials.password
          })
          .expect(400)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            res.body.message.should.equal('Please provide a new password');
            return done();
          });
      });
  });

  it('should not be able to change user own password if no new password is at all given', function (done) {

    // Change password
    agent.post('/api/users/password')
      .send({
        newPassword: '1234567890Aa$',
        verifyPassword: '1234567890Aa$',
        currentPassword: credentials.password
      })
      .expect(400)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        res.body.message.should.equal('User is not signed in');
        return done();
      });
  });

  it('should be able to get own user details successfully', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get own user details
        agent.get('/api/users/me')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            res.body.should.be.instanceof(Object);
            res.body.username.should.equal(user.username);
            res.body.email.should.equal(user.email);
            should.not.exist(res.body.salt);
            should.not.exist(res.body.password);
            return done();
          });
      });
  });

  it('should not be able to get any user details if not logged in', function (done) {
    // Get own user details
    agent.get('/api/users/me')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        should.not.exist(res.body);
        return done();
      });
  });

  it('should be able to update own user details', function (done) {
    user.roles = ['admin'];

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

          var userUpdate = {
            firstName: 'user-update-first',
            lastName: 'user-update-last',
            roles: user.roles,
            provider:user.provider
          };

          agent.put('/api/users/' + user._id)
            .send(userUpdate)
            .expect(200)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              userInfoRes.body.should.be.instanceof(Object);
              userInfoRes.body.firstName.should.be.equal('user-update-first');
              userInfoRes.body.lastName.should.be.equal('user-update-last');
              userInfoRes.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);
              userInfoRes.body.roles.indexOf('admin').should.equal(0);
              userInfoRes.body.userId.should.be.equal(String(user._id));

              // Call the assertion callback
              return done();
            });
        });
    });
  });


  it('should not be able to update user details with root role and keeping password blank', function (done) {
    userRoot.password = credentials.password;

    userRoot.save(function (err) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentialsroot)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          var userUpdate = {
            firstName: 'user-update-first-test',
            lastName: 'user-update-last-test',
            roles: ['root'],
            password: '',
            provider: 'local'
          };

          agent.put('/api/users/'+userRoot._id)
            .send(userUpdate)
            .expect(400)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }
              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should not be able to update own user details and add roles if not admin', function (done) {
    user.roles = ['user'];
    user.tenant = _tenant._id;

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

          var userUpdate = {
            firstName: 'user-update-first',
            lastName: 'user-update-last',
            roles: ['user', 'admin']
          };

          agent.put('/api/users/' + user._id )
            .send(userUpdate)
            .expect(403)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }

              // Call the assertion callback
              return done();
            });
        });
    });
  });

  it('should not be able to update own user details with existing username', function (done) {

    var _user2 = _user;

    _user2.username = 'userusername';
    _user2.email = 'user2_email@test.com';
    _user2.phone = 12312412312;

    var credentials2 = {
      username: 'usernametwo1',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    _user2.username = credentials2.username;
    _user2.password = credentials2.password;
    _user2.tenant = mongoose.Types.ObjectId(_tenant.id);
    _user2.roles = ['admin'];
    _user2.provider = 'local';

    var user2 = new User(_user2);

    user2.save(function (err, user) {
      should.not.exist(err);
      agent.post('/api/auth/signin')
        .send(credentials2)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          var userUpdate = {
            firstName: 'user-update-first',
            lastName: 'user-update-last',
            username: credentials.username,
            roles : _user2.roles
          };

          agent.put('/api/users/' + user2._id)
            .send(userUpdate)
            .expect(200)
            .end(function (userInfoErr, userInfoRes) {
              if (userInfoErr) {
                return done(userInfoErr);
              }
              //check that username is not changed
              userInfoRes.body.username.should.equal(credentials2.username);
              // Call the assertion callback
              return done();
            });
        });
    });
  });


  it('should not be able to update own user details if not logged-in', function (done) {
    user.roles = ['user'];

    user.save(function (err) {

      should.not.exist(err);

      var userUpdate = {
        firstName: 'user-update-first',
        lastName: 'user-update-last',
      };

      agent.put('/api/users/'+user._id)
        .send(userUpdate)
        .expect(401)
        .end(function (userInfoErr, userInfoRes) {
          if (userInfoErr) {
            return done(userInfoErr);
          }

          userInfoRes.body.message.should.equal('Invalid username/password');

          // Call the assertion callback
          return done();
        });
    });
  });

  it('should not be able to update own user profile picture without being logged-in', function (done) {

    agent.post('/api/users/picture')
      .send({})
      .expect(400)
      .end(function (userInfoErr, userInfoRes) {
        if (userInfoErr) {
          return done(userInfoErr);
        }

        userInfoRes.body.message.should.equal('User is not signed in');

        // Call the assertion callback
        return done();
      });
  });

  it('should be able to change profile picture if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        agent.post('/api/users/picture')
          .attach('newProfilePicture', './modules/users/client/img/profile/default.png')
          .send(credentials)
          .expect(200)
          .end(function (userInfoErr, userInfoRes) {
            // Handle change profile picture error
            if (userInfoErr) {
              done(userInfoErr);
            }

            userInfoRes.body.should.be.instanceof(Object);
            userInfoRes.body.profileImageURL.should.be.a.String();
            userInfoRes.body.userId.should.be.equal(String(user._id));

            return done();
          });
      });
  });

  it('should not be able to change profile picture if attach a picture with a different field name', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/users/picture')
          .attach('fieldThatDoesntWork', './modules/users/client/img/profile/default.png')
          .send(credentials)
          .expect(400)
          .end(function (userInfoErr, userInfoRes) {
            done(userInfoErr);
          });
      });
  });

  afterEach(function (done) {
    Tenant.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});
