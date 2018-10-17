'use strict';

// Icrs controller
angular.module('icrs').controller('IcrsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Tenants', 'Servers', 'Icrs', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, $http, Authentication, Tenants, Servers, Icrs, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.labels = featuresSettings.labels;
    $scope.icrAccessRoles = featuresSettings.roles.icr;
    
    $http.get('/api/lookups/icrstatus')
      .then(function(response) {
        $scope.validStatusToAssign = response.data;
      });    

    if($scope.isRoot) {
      $scope.tenants = Tenants.query();
      $scope.$watch("tenants", function(newVal, oldVal) {
        if(newVal && newVal.length === 1){
          $scope.tenantId = newVal[0].tenantId;
        }
      });     
    } else {
      $scope.tenantId = $scope.authentication.user.tenant;
    }

    $scope.$watch("tenantId", function(newVal, oldVal) {
      if (newVal) {
        $scope.populatevfas(newVal, function() {
          if($scope.servers.length === 1){
            $scope.serverId = $scope.servers[0].serverId;
          }
        });        
      }        
    });
    
    var flashTimeout = 3000;
    
    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }   
    $scope.servers = Servers.query();
    // Create new Icr
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'icrForm');
        return false;
      }

      // Create new Icr object
      var icr = new Icrs({
        message: $sanitize(this.message),
        clusterExt: $sanitize(this.clusterExt),
        ipsExt: $sanitize(this.ipsExt),
        serverId: $sanitize(this.serverId),
        tenantId: (($scope.isRoot) ? $sanitize(this.tenantId) : $scope.authentication.user.tenant)
      });

      // Redirect to the icrs page
      icr.$create(function (response) {
        $location.path('icrs');
        //Flash.create('success', '<strong ng-non-bindable>Successfully created the Inter-cluster Relationship!<br>Email has been sent to : ' + $scope.authentication.user.email + '</strong>', flashTimeout, { class: '', id: '' }, true);
        Flash.create('success', '<strong ng-non-bindable>Successfully created the Inter-cluster Relationship!</strong>', flashTimeout, { class: '', id: '' }, true);
        // Clear form fields
        $scope.message = '';
        $scope.clusterExt = '';
        $scope.ipsExt = '';
        $scope.serverId = '';
        $scope.tenantId = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Remove existing Icr
    $scope.remove = function (icr) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete ICR?',
        bodyText: ['Are you sure you want to delete this ICR?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (icr) {
          icr.$remove(function (response) {
            $location.path('icrs');
            //Flash.create('success', '<strong ng-non-bindable>Successfully submitted Delete request for the ICR! email has been sent to : ' + $sanitize($scope.authentication.user.email) + '</strong>', flashTimeout, { class: '', id: '' }, true);
            Flash.create('success', '<strong ng-non-bindable>Successfully submitted Delete request for the ICR!</strong>', flashTimeout, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });

          for (var i in $scope.icrs) {
            if ($scope.icrs[i] === icr) {
              $scope.icrs.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Icr
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'icrForm');
        return false;
      }

      var icr = $scope.icr;   

      icr.$update(function () {
        $location.path('icrs');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the Inter-cluster Relationship!</strong>', flashTimeout, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Find a list of Icrs
    $scope.find = function () {
      $scope.icrs = Icrs.query();
      $scope.tenants = Tenants.query();
    };

    // Find existing Icr
    $scope.findOne = function () {
      Icrs.get({
        icrId: $stateParams.icrId
      }, function(data) {
        $scope.icr = data;        
      }, function(error){
        $location.path('icrs');
        throwFlashErrorMessage('No ICR with that identifier has been found');
      });
    };

    var getvFAS = function(tenant, servers) {
      var serverList = [];
      if (!tenant) {
        serverList = servers;
      } else {
        angular.forEach(servers, function(server) {
          if (server.tenant && server.tenant._id === tenant && server.managed === 'Customer') {
             serverList.push(server);
          }
        });
      }
      return serverList;
    };

    $scope.populatevfas = function(tenant, callback) {
      var servers = Servers.query();
      servers.$promise.then(function(results) {
        $scope.servers = getvFAS(tenant, servers);
        callback();
      });
    };
  }
]);
