'use strict';

/**
* Module dependencies.
*/
var should = require('should'),
mongoose = require('mongoose'),
path = require('path'),
featuresSettings = require(path.resolve('./config/features')),
User = mongoose.model('User'),
Site = mongoose.model('Site'),
Tenant = mongoose.model('Tenant'),
Subscription = mongoose.model('Subscription');

/**
* Globals
*/
var user, subscription, site, tenant, subscription1, tenant1;

/**
* Unit tests
*/
describe('Subscription Model Unit Tests:', function () {
  this.timeout(5000);
  beforeEach(function (done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    site = new Site({
      name: 'Test Site',
      code: 'tst'
    });

    tenant = new Tenant({
      name: 'Test Tenant',
      code: 'ttttt'
    });

    tenant1 = new Tenant({
      name: 'Test Tenant1',
      code: 'ttttt1'
    });

    //initialize annotation when setting is enabled
    if (featuresSettings.tenant.annotation.enabled && featuresSettings.tenant.annotation.mandatory) {
      tenant.annotation = 'test';
      tenant1.annotation = 'test';
    }

    user.save(function () {
      tenant.save(function(){
        tenant1.save(function(){
          site.save(function(){
            subscription = new Subscription({
              name: 'Test Title',
              code: 'testcode',
              description: 'testdesc',
              url: 'http://testme.com',
              tenant: tenant._id,
              site: site._id,
              user: user
            });

            subscription1 = new Subscription({
              name: 'Test Title',
              code: 'testcode1',
              description: 'testdesc1',
              url: 'http://test.com',
              tenant: tenant1._id,
              site: site._id,
              user: user
            });

            //initialize subscription pack when prepaid payment method setting is enabled
            if (featuresSettings.paymentMethod.prePaid) {
              subscription.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
              subscription1.storagePack = [{'class' : 'ontap-capacity', sizegb : { 'procured' : 1 }}];
            }
            done();
          });
        });
      });
    });
  });

  describe('Method Save', function () {
    it('should be able to save & delete without problems', function (done) {
      this.timeout(10000);
      subscription.save(function (err) {
        should.not.exist(err);
        subscription.remove(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to save with same names in different tenant', function (done) {
      subscription.save(function (err) {
        should.not.exist(err);
        subscription1.save(function(err){
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save with same names within a tenant', function (done) {
      subscription1.tenant = tenant._id;
      subscription.save(function (err) {
        should.not.exist(err);
        subscription1.save(function(err){
          should.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save with same code within a tenant', function (done) {
      subscription1.tenant = tenant;
      subscription.save(function (err) {
        should.not.exist(err);
        subscription1.code = subscription.code;
        subscription1.title = 'testtitle';
        subscription1.save(function(err){
          should.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save name with invalid char', function (done) {
      subscription.name = 'sub_name';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save name with less than 3 char', function (done) {
      subscription.name = 'su';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save name with more than 32 char', function (done) {
      subscription.name = 'susdfdsfsdfsdgfsdfsdfsdfsdfsdfsdfdsfdsfdsfds';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without code', function (done) {
      subscription.code = '';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save code with invalid char ie.CaptialCode()', function (done) {
      subscription.code = 'CaptialCode()';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save code with invalid char ie.123:', function (done) {
      subscription.code = '123:';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save code with invalid char ie.a123A', function (done) {
      subscription.code = 'a123A';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });


    it('should be able to show an error when try to save code with less than 3 char', function (done) {
      subscription.code = 'as';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save code with more than 16 char', function (done) {
      subscription.code = 'asdsadasdascvcvdsads';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without a tenant', function (done) {
      subscription.tenant = null;
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with a invalid tenant', function (done) {
      subscription.tenant = 'test';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with a invalid site', function (done) {
      subscription.site = 'test';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save with a invalid partner', function (done) {
      subscription.partner = 'test';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error or pass when try to save without a site based on feature settings', function (done) {
      subscription.site = null;
      subscription.save(function (err) {
        //if setting is enabled and mandatory error should exit
        if (featuresSettings.subscription.site.enabled && featuresSettings.subscription.site.mandatory) {
          should.exist(err);
        } else {
          should.not.exist(err);
        }        
        done();
      });
    });

    it('should be able to show an error or pass when try to save without a description based on feature settings', function (done) {
      subscription.description = '';
      subscription.save(function (err) {
        //if setting is enabled and mandatory error should exit
        if (featuresSettings.subscription.description.enabled && featuresSettings.subscription.description.mandatory) {
          should.exist(err);
        } else {
          should.not.exist(err);
        }        
        done();
      });
    });

    it('should be able to show an error or pass when try to save without a url based on feature settings', function (done) {
      subscription.url = '';
      subscription.save(function (err) {
        //if setting is enabled and mandatory error should exit
        if (featuresSettings.subscription.url.enabled && featuresSettings.subscription.url.mandatory) {
          should.exist(err);
        } else {
          should.not.exist(err);
        }        
        done();
      });
    });

    it('should be able to show an error or pass when try to save without a subscription pack based on feature settings payment method', function (done) {
      subscription.storagePack = [];
      subscription.save(function (err) {
        //if setting is enabled and mandatory error should exit
        if (featuresSettings.paymentMethod.prePaid) {
          should.exist(err);
        } else {
          should.not.exist(err);
        }        
        done();
      });
    });

    //test cases related to storagePack
    if (featuresSettings.paymentMethod.prePaid) {
      it('should be able to show an error when try to save with invalid a storage pack ie. {"class" : "test", "sizegb" : {"procured" : 1}}', function (done) {
        subscription.storagePack = [{"class" : "test", "sizegb" : {"procured" : 1}}];
        subscription.save(function (err) {  
          //error saying test is not valid value for class
          should.exist(err);              
          done();
        });
      });

      it('should be able to show an error when try to save with invalid a storage pack ie. {"class" : "ontap-capacity", "sizegb" : {}}', function (done) {
        subscription.storagePack = [{"class" : "ontap-capacity", "sizegb" : {}}];
        subscription.save(function (err) {  
          //error saying size procured required
          should.exist(err);              
          done();
        });
      });

      it('should be able to show an error when try to save with invalid a storage pack with negative ie. {"class" : "ontap-capacity", "sizegb" :{"procured" : -1}}', function (done) {
        subscription.storagePack = [{"class" : "ontap-capacity", "sizegb" : {"procured" : -1}}];
        subscription.save(function (err, subscription) {  
          //error saying size procured should not be negative        
          should.exist(err);              
          done();
        });
      });

      it('should be able to show an error when try to update with invalid a storage pack with negative ie. {"class" : "ontap-capacity", "sizegb" :{"procured" : 1, "available" : -1}}', function (done) {
        subscription.save(function (err, subscription) {  
          subscription.storagePack = [{"class" : "ontap-capacity", "sizegb" : {"procured" : 1, "available" : -1}}];
          subscription.save(function (err, subscription) {
            //error saying size available should not be negative        
            should.exist(err);              
            done();
          });
        });
      });

      it('should be able to show an error when try to save with invalid a storage pack with duplicate classes ie. [{"class" : "ontap-capacity", "sizegb" :{"procured" : 1}, {"class" : "ontap-capacity", "sizegb" :{"procured" : 1}]', function (done) {
        subscription.storagePack = [
        {"class" : "ontap-capacity", "sizegb" : {"procured" : 1}},
        {"class" : "ontap-capacity", "sizegb" : {"procured" : 1}}
        ];
        subscription.save(function (err, subscription) {  
          //error saying class already exist       
          should.exist(err);              
          done();
        });
      });
    }


    it('should be able to show an error when try to save description with invalid char', function (done) {
      subscription.description = '@desc_*&';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save description with more than 256 char', function (done) {
      subscription.description = 'sdfsdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhfdshfksdfksdfksdjhfsdkjhfksdfhsdkjfhsdkfhskdfhsdkfhskdksdhfkdshfkdshfksdhfksdhfksdhfksdfhksdjhfksdhfksdfhsdkjfhsdkfhksdjfhsdjfhsdkjfhsdkfhsdkfndlkdncldsfejsdlxzjvfgsadjvnsdzljvndngsdngs';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });    

    it('should be able to show an error when try to save url with more than 256 char', function (done) {
      subscription.url = 'sdfsdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhdfsdfsdhfksdhfksdhfksdhfksdhfsdfosdjfosdjfosdjfosdhfdshfsdhfdshfksdfksdfksdjhfsdkjhfksdfhsdkjfhsdkfhskdfhsdkfhskdksdhfkdshfkdshfksdhfksdhfksdhfksdfhksdjhfksdhfksdfhsdkjfhsdkfhksdjfhsdjfhsdkjfhsdkfhsdkfndlkdncldsfejsdlxzjvfgsadjvnsdzljvndngsdngs';
      subscription.save(function (err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to get the json Object with removed security risk values to display', function (done) {
      this.timeout(10000);
      subscription.save(function (err, subResponse) {
        should.not.exist(err);
        var obj =  JSON.parse(JSON.stringify(subResponse));

        should.not.exist(obj.__v);
        should.not.exist(obj.created);
        should.not.exist(obj._id);
        should.not.exist(obj.user);       
        if (featuresSettings.paymentMethod.prePaid) {
          should.exist(obj.storagePack);
        } else {
          should.not.exist(obj.storagePack);
        } 
        subscription.remove();
        //should.exist(obj.storageunitId);
        done();
      });      
    });


  });

  afterEach(function (done) {
    Subscription.remove().exec(function () {
      tenant.remove();
      site.remove();
      tenant1.remove();
      Subscription.remove();
      User.remove().exec(done);
    });
  });
});
