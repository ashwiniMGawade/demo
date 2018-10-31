'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  path = require('path'),
  featuresSettings = require(path.resolve('./config/features')),
  User = mongoose.model('User'), 
  moment = require('moment'),
  Notification = mongoose.model('Notification'),
  Server = mongoose.model('Server'),
  Tenant = mongoose.model('Tenant');

/**
 * Globals
 */
var user, tenant, notification, utcMoment;


utcMoment = moment.utc();

/**
 * Unit tests
 */
describe('Notifications Model Unit Tests:', function () {
  this.timeout(5000);
  beforeEach(function (done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3',
      roles: ['admin'],
      provider:'raa'
    });
    tenant = new Tenant({
      name: 'Tenant Name',
      code: 'tttt'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
    }
    
    tenant.save(function (err) {
      should.not.exist(err);
      user.tenant = tenant;     
      user.save(function(err){
        should.not.exist(err);
        notification = new Notification({
          user: user,
          message: 'test message',
          summary: 'test cluster text',
          category: 'Information',
          start:new Date(utcMoment.format()).getTime() + 50000,
          end:new Date(utcMoment.format()).getTime() + 80000,
          tenants: [tenant]
        });

        done();
      });        
    });  
  });

  describe('Method Save', function () {
    it('should be able to save & delete without problems', function (done) {
      notification.save(function (err) {
        should.not.exist(err);
        notification.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to update & delete without problems', function (done) {
      notification.save(function (err) {
        should.not.exist(err);
        notification.message = 'test new message';
        notification.save(function (err) {
          should.not.exist(err);
          notification.remove(function (err) {
            should.not.exist(err);
            done();
          });
        });
      });
    });

    it('should be able to show an error when try to save without notification summary', function (done) {
      notification.summary = '';
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without notification category', function (done) {
      notification.category = null;
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without notification start', function (done) {
      notification.start = null;
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    // it('should be able to show an error when try to save with notification start in other than UTC timezone', function (done) {
    //   var curDate = new Date();
    //   notification.start = curDate;
    //   notification.save(function (err) {
    //     should.exist(err);
    //     (err.errors.start.message).should.equal("Start date should be in UTC format.");
    //     done();
    //   });
    // });

    it('should be able to show an error when try to save with notification start  greater than cur date', function (done) {
      var curDate = new Date(utcMoment.format());
      curDate.setHours(0,0,0,0);
      notification.start = curDate.getTime() - 8000;
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with notification end < start, end < cur date', function (done) {
      var curDate = new Date(utcMoment.format());
      curDate.setHours(0,0,0,0);
      notification.start = curDate.getTime();
      notification.end = curDate.getTime()- 8000;
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without notification end', function (done) {
      notification.end = null;
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    // it('should be able to show an error when try to save with notification end in other than UTC timezone', function (done) {
    //   var curDate = new Date();
    //   notification.end = curDate;
    //   notification.save(function (err) {
    //     should.exist(err);
    //     (err.errors.end.message).should.equal("End date should be in UTC format.");
    //     done();
    //   });
    // });


    it('should be able to show an error when try to save with invalid category', function (done) {
      notification.category = 'test';
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with invalid tenants', function (done) {
      notification.tenants = [user.userId];
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to save with tenants field blank', function (done) {
      notification.tenants = [];
      notification.save(function (err) {
        should.not.exist(err);
        notification.remove(function (err) {
          should.not.exist(err);
          done();
        });        
      });
    });




    it('should be able to show an error when try to save notification message less than 3 char', function (done) {
      notification.message = 'TT';
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save notification message more than 1024 char', function (done) {
      notification.message = 'TTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTTTTTTTTTasdfasdfasdfasdfasdfasdfasdfsadhfsakjdhfkajsdhfjskhdfsjdhfskaskdflakdflasdf aksjdfaldsf akjsdhfas kajsdhfladhfa kajshdflakdhf alkdsflakdshfasdfjkadjfaksdjfhakdfhaksdfhakdfhaksdfakfasfsakjhfskfhskhfshflkhsdfsldfalsfhskdffalsdfjasdlflasdfadsfadasdfasdfsfasdfsadfasdfasdasdfasTT';
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save notification summary more than 64 char', function (done) {
      notification.summary = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT';
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });
   
    it('should be able to save notification with valid user id array', function (done) {
      notification.users = [user._id];
      notification.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with notification message with an invalid special character', function (done) {
      notification.message = '!';
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with an invalid special character', function (done) {
      notification.summary = '.';
      notification.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);   
      notification.save(function (err, notificationres) {
        should.not.exist(err);  
        var obj = JSON.stringify(notificationres);
        should.not.exist(obj.__v);
        should.not.exist(obj.created);
        should.not.exist(obj._id);
        should.not.exist(obj.user);
        notification.remove(function (err) {
          should.not.exist(err);
          done();
        });
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
