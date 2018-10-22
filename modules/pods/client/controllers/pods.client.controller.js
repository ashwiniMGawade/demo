'use strict';

// Pods controller
angular.module('pods').controller('PodsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Pods', 'Sites', 'Clusters', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, Authentication, Pods, Sites, Clusters, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.site = Sites;
    $scope.clusters = Clusters.query();
    $scope.podAccessRoles = featuresSettings.roles.pod;

    $scope.someSelected = false;
    $scope.selectedClusters = {};
    $scope.touched = false;

    
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

    var calculateSomeSelected = function() {
      $scope.touched = true;
      $scope.someSelected = Object.keys($scope.selectedClusters).some(function (key) {
        return $scope.selectedClusters[key];
      });
    };

    $scope.checkboxChanged = calculateSomeSelected;

    // Create new Pod
    $scope.create = function (isValid) {
      $scope.error = null;
      $scope.touched = true;
      var clusts = [];

      const keys = Object.keys($scope.selectedClusters)
      for (const key of keys) {
        if ($scope.selectedClusters[key] == true) {
          clusts.push(key);
        }
      }

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'podForm');

        return false;
      }

      

      // Create new Pod object
      var pod = new Pods({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        siteId: $sanitize(this.siteId),
        cluster_keys: clusts
      });


      // Redirect after save
      pod.$create(function (response) {
        $location.path('pods');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the pod!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
        $scope.siteId = '';
        $scope.cluster_keys = {};
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Remove existing Pod
    $scope.remove = function (pod) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Pod?',
        bodyText: ['Are you sure you want to delete this Pod?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (pod) {
          pod.$remove(function (response) {
            $location.path('pods');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the pod!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);           
          });

          for (var i in $scope.pods) {
            if ($scope.pods[i] === pod) {
              $scope.pods.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Pod
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'podForm');

        return false;
      }

      var pod = $scope.pod;

      pod.$update(function () {
        $location.path('pods');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the pod!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Find a list of Pods
    $scope.find = function () {
      $scope.pods = Pods.query();
      $scope.sites = Sites.query();
    };

    // Find existing Pod
    $scope.findOne = function () {
      Pods.get({
        podId: $stateParams.podId
      }, function(data) {
        $scope.pod = data;
      }, function(error){
        $location.path('pods');
        throwFlashErrorMessage('No pod with that identifier has been found');
      });
    };
  }
]);
