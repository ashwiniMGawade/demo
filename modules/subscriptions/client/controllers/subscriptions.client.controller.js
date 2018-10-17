'use strict';

// Subscriptions controller
angular.module('subscriptions').controller('SubscriptionsController', ['$scope', '$stateParams', '$location', '$http', '$filter','Authentication', 'Subscriptions', 'Sites', 'Tenants', 'modalService', 'Flash', '$sanitize', 
  function ($scope, $stateParams, $location, $http, $filter, Authentication, Subscriptions, Sites, Tenants, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.subscriptionSettings = featuresSettings.subscription;
    $scope.paymentMethod = featuresSettings.paymentMethod;
    $scope.storagePacks = [{ 'class' : '', 'sizegb' : { 'procured': '' } }];
    $scope.subscriptionAccessRoles = featuresSettings.roles.subscription;

    $http.get('api/lookups/storagePackClasses')
    .then(function(response) {
      $scope.validStoragepackClassesToAssign = response.data;
    });

    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      var errMsg = message;
      //If error Message is a list of errors (object), show only the first error
      if(typeof message === 'object'){
        errMsg = message[Object.keys(message)[0]];
      }
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(errMsg) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    //function to create new capacity pack
    $scope.addNewCapacityPack = function() {
      $scope.storagePacks.push({ 'class' : '', 'sizegb' : { 'procured': '' } });
    };

    $scope.removeCapacityPack = function(index) {
      $scope.storagePacks.splice(index, 1);
    };

    $scope.checkIfClassExist = function(className, index) {
      var PacksWithexistingClass = $filter('filter')($scope.storagePacks, { class: className });
      if (PacksWithexistingClass.length > 1) {
        throwFlashErrorMessage('Storage class ' + className + ' already exists.');
        $scope.storagePacks.splice(index, 1);
      }
    };

    // Create new Subscription
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'subscriptionForm');

        return false;
      }

      // Create new Subscription object
      var subscription = new Subscriptions({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        siteId : $sanitize(this.siteId),
        tenantId : $sanitize(this.tenantId),
        partnerId: $sanitize(this.partnerId),
        description : $sanitize(this.description),
        url : $sanitize(this.url),
        storagePack:this.storagePacks
      });

      // Redirect after save
      subscription.$create(function (response) {
        $location.path('subscriptions');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the subscription!</strong>', flashTimeout, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Remove existing Subscription
    $scope.remove = function (subscription) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Subscription?',
        bodyText: ['Are you sure you want to delete this Subscription?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (subscription) {
          subscription.$remove(function (response) {
            $location.path('subscriptions');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the subscription!</strong>', flashTimeout, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });

          for (var i in $scope.subscriptions) {
            if ($scope.subscriptions[i] === subscription) {
              $scope.subscriptions.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Subscription
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'subscriptionForm');
        return false;
      }

      var subscription = $scope.subscription;

      subscription.$update(function () {
        $location.path('subscriptions');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the subscription!</strong>', flashTimeout, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Find a list of Subscriptions
    $scope.find = function () {
      $scope.subscriptions = Subscriptions.query();
      $scope.sites = Sites.query();
      $scope.tenants = Tenants.query();
    };

    // Find existing Subscription
    $scope.findOne = function () {
      Subscriptions.get({
        subscriptionId: $stateParams.subscriptionId
      }, function(data) {
        $scope.subscription = data;
      }, function(error){
        $location.path('subscriptions');
        throwFlashErrorMessage('No subscription with that identifier has been found');
      });
    };
  }
]);
