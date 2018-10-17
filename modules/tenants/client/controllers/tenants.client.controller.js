'use strict';

// Tenants controller
angular.module('tenants').controller('TenantsController', ['$scope', '$stateParams', '$location', '$rootScope', 'Authentication', 'Tenants', 'modalService', 'Flash', '$sanitize', 
  function ($scope, $stateParams, $location, $rootScope, Authentication, Tenants, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.annotationSetting = featuresSettings.tenant.annotation;
    $scope.tenantAccessRoles = featuresSettings.roles.tenant;

    var flashTimeout = 3000;
    
    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    // Create new Tenant
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'tenantForm');
        return false;
      }

      // Create new Tenant object
      var tenant = new Tenants({
        name: $sanitize(this.name),
        code: $sanitize(this.code)
      });

      //initialize annotation when setting is enabled
      if (featuresSettings.tenant.annotation.enabled) {
        tenant.annotation = $sanitize(this.annotation);
      }     
      // initialize partner reference when root       
      if ($scope.isRoot) {
        tenant.partnerId = $sanitize(this.partnerId);
      } 

      // Redirect after save
      tenant.$create(function (response) {
        $location.path('tenants');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the tenant!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
        $scope.annotation = '';
        $scope.partnerId = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Remove existing Tenant
    $scope.remove = function (tenant) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete tenant?',
        bodyText: ['Are you sure you want to delete this tenant?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (tenant) {
          //redirect to list after delete from db
          tenant.$remove(function (response) {
            $location.path('tenants');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the tenant!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });
          //remove from current javascript tenants list
          for (var i in $scope.tenants) {
            if ($scope.tenants[i] === tenant) {
              $scope.tenants.splice(i, 1);
            }
          }
        }
      });
    };

    /* To be removed
    // Export the Volumes of an existing Tenant
    $scope.exportcsv = function (tenant) {
      if (tenant) {
        tenant.$exportcsv();

        for (var i in $scope.tenants) {
          if ($scope.tenants[i] === tenant) {
            $scope.tenants.splice(i, 1);
          }
        }
      } else {
        $scope.tenant.$exportcsv(function () {
          $location.path('tenants');
        });
      }
    };
    */

    // Update existing Tenant
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'tenantForm');

        return false;
      }

      var tenant = $scope.tenant;

      tenant.$update(function () {
        $location.path('tenants');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the tenant!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Find a list of Tenants
    $scope.find = function () {
      $scope.tenants = Tenants.query();
    };

    // Find existing Tenant
    $scope.findOne = function () {
      Tenants.get({
        tenantId: $stateParams.tenantId
      }, function(data) {
        $scope.tenant = data;
      }, function(error){
        $location.path('tenants');
        throwFlashErrorMessage('No tenant with that identifier has been found');
      });
    };
  }
]);
