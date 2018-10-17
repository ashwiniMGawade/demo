'use strict';

// Subtenants controller
angular.module('subtenants').controller('SubtenantsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Tenants', 'Subtenants', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, Authentication, Tenants, Subtenants, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.tenants = Tenants;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.labels = featuresSettings.labels;
    $scope.subtenantAccessRoles = featuresSettings.roles.subtenant;

    var flashTimeout = 3000;
    
    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    // Create new Subtenant
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'subtenantForm');
        return false;
      }

      // Create new Subtenant object
      var subtenant = new Subtenants({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        tenantId: $sanitize(this.tenantId)
      });

      // Redirect to the subtenants page
      subtenant.$create(function (response) {
        $location.path('subtenants');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the subtenant!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
        $scope.tenantId = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Remove existing Subtenant
    $scope.remove = function (subtenant) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Subtenant?',
        bodyText: ['Are you sure you want to delete this Subtenant?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (subtenant) {
          subtenant.$remove(function (response) {
            $location.path('subtenants');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the subtenant!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message); 
          });

          for (var i in $scope.subtenants) {
            if ($scope.subtenants[i] === subtenant) {
              $scope.subtenants.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Subtenant
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'subtenantForm');
        return false;
      }

      var subtenant = $scope.subtenant;

      subtenant.$update(function () {
        $location.path('subtenants');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the subtenant!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Find a list of Subtenants
    $scope.find = function () {
      $scope.subtenants = Subtenants.query();
      $scope.tenants = Tenants.query();
    };

    // Find existing Subtenant
    $scope.findOne = function () {
      Subtenants.get({
        subtenantId: $stateParams.subtenantId
      }, function(data) {
        $scope.subtenant = data;
      }, function(error){
        $location.path('subtenants');
        throwFlashErrorMessage('No subtenant with that identifier has been found');
      });
    };
  }
]);
