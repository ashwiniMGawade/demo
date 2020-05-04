'use strict';

// Applications controller
angular.module('applications').controller('ApplicationsController', ['$scope', '$stateParams', '$location', '$rootScope', 'Authentication', 'Applications', 'modalService', 'Flash', '$sanitize', 
  function ($scope, $stateParams, $location, $rootScope, Authentication, Applications, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.applicationAccessRoles = featuresSettings.roles.application;

    var flashTimeout = 3000;
    
    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    // Create new Application
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'applicationForm');
        return false;
      }

      // Create new Application object
      var application = new Applications({
        name: $sanitize(this.name),
        code: $sanitize(this.code)
      });
      // Redirect after save
      application.$create(function (response) {
        $location.path('applications');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the application!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Remove existing Application
    $scope.remove = function (application) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete application?',
        bodyText: ['Are you sure you want to delete this application?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (application) {
          //redirect to list after delete from db
          application.$remove(function (response) {
            $location.path('applications');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the application!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });
          //remove from current javascript applications list
          for (var i in $scope.applications) {
            if ($scope.applications[i] === application) {
              $scope.applications.splice(i, 1);
            }
          }
        }
      });
    };

    /* To be removed
    // Export the Volumes of an existing Application
    $scope.exportcsv = function (application) {
      if (application) {
        application.$exportcsv();

        for (var i in $scope.applications) {
          if ($scope.applications[i] === application) {
            $scope.applications.splice(i, 1);
          }
        }
      } else {
        $scope.application.$exportcsv(function () {
          $location.path('applications');
        });
      }
    };
    */

    // Update existing Application
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'applicationForm');

        return false;
      }

      var application = $scope.application;

      application.$update(function () {
        $location.path('applications');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the application!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Find a list of Applications
    $scope.find = function () {
      $scope.applications = Applications.query();
    };

    // Find existing Application
    $scope.findOne = function () {
      Applications.get({
        applicationId: $stateParams.applicationId
      }, function(data) {
        $scope.application = data;
      }, function(error){
        $location.path('applications');
        throwFlashErrorMessage('No application with that identifier has been found');
      });
    };
  }
]);
