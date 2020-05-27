'use strict';

// Pods controller
angular.module('systems').controller('SystemsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Systems', 'Applications', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, Authentication, Systems, Applications, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.systemAccessRoles = featuresSettings.roles.system;
    $scope.applicationsList = Applications.query()
    
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

    // Create new system
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'systemForm');

        return false;
      }

      // Create new system object
      var system = new Systems({
        name: $sanitize(this.name),
        wwn: $sanitize(this.wwn),
        rest_url_ip: $sanitize(this.rest_url_ip),
        provisioning_state: $sanitize(this.provisioning_state),
        applications: this.applications
      });

      // Redirect after save
      system.$create(function (response) {
        $location.path('systems');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the system!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.wwn = '';
        $scope.rest_url_ip = '';
        $scope.provisioning_state = '';
        $scope.rest_uri = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Remove existing system
    $scope.remove = function (system) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete system?',
        bodyText: ['Are you sure you want to delete this system?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (system) {
          system.$remove(function (response) {
            $location.path('systems');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the system!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);           
          });

          for (var i in $scope.systems) {
            if ($scope.systems[i] === system) {
              $scope.systems.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing system
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'systemForm');

        return false;
      }

      var system = $scope.system;
      system.applications = this.applications

      system.$update(function () {
        $location.path('systems');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the system!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Find a list of systems
    $scope.find = function () {
      $scope.systems = Systems.query();
    };

    // Find existing system
    $scope.findOne = function () {
      Systems.get({
        systemId: $stateParams.systemId
      }, function(data) {
        $scope.system = data;
        var applicationList = [];
        data.applications.forEach(function(app) {
          applicationList.push(app._id)
        });
        $scope.applications = applicationList;
      }, function(error){
        $location.path('systems');
        throwFlashErrorMessage('No system with that identifier has been found');
      });
    };
  }
]);
