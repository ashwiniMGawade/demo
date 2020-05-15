'use strict';

// Pods controller
angular.module('clusters').controller('ClustersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Clusters', 'Applications', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, Authentication, Clusters, Applications, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.clusterAccessRoles = featuresSettings.roles.cluster;
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

    // Create new cluster
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'clusterForm');

        return false;
      }

      // Create new cluster object
      var cluster = new Clusters({
        name: $sanitize(this.name),
        uuid: $sanitize(this.uuid),
        management_ip: $sanitize(this.management_ip),
        provisioning_state: $sanitize(this.provisioning_state),
        applications: this.applications,
        dr_enabled:this.dr_enabled
      });

      // Redirect after save
      cluster.$create(function (response) {
        $location.path('clusters');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the cluster!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.uuid = '';
        $scope.management_ip = '';
        $scope.provisioning_state = '';
        $scope.rest_uri = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Remove existing cluster
    $scope.remove = function (cluster) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete cluster?',
        bodyText: ['Are you sure you want to delete this cluster?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (cluster) {
          cluster.$remove(function (response) {
            $location.path('clusters');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the cluster!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);           
          });

          for (var i in $scope.clusters) {
            if ($scope.clusters[i] === cluster) {
              $scope.clusters.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing cluster
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'clusterForm');

        return false;
      }

      var cluster = $scope.cluster;
      cluster.applications = this.applications

      cluster.$update(function () {
        $location.path('clusters');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the cluster!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message); 
      });
    };

    // Find a list of clusters
    $scope.find = function () {
      $scope.clusters = Clusters.query();
    };

    // Find existing cluster
    $scope.findOne = function () {
      Clusters.get({
        clusterId: $stateParams.clusterId
      }, function(data) {
        $scope.cluster = data;
        var applicationList = [];
        data.applications.forEach(function(app) {
          applicationList.push(app._id)
        });
        $scope.applications = applicationList;
      }, function(error){
        $location.path('clusters');
        throwFlashErrorMessage('No cluster with that identifier has been found');
      });
    };
  }
]);
