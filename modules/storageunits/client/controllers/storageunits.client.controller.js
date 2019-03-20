'use strict';

// Storage units controller

angular.module('storageunits')
	.controller('StorageunitsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Storageunits', 'Servers', 'Storagegroups', 'Flash', 'modalService', 'Tenants', '$sanitize',
  function ($scope, $stateParams, $location, $http, Authentication, Storageunits, Servers, Storagegroups, Flash, modalService, Tenants, $sanitize) {
  	$scope.authentication = Authentication;    
    $scope.storagegroups = [];
    $scope.servers = [];
    $scope.labels = featuresSettings.labels;
    $scope.SUAccessRoles = featuresSettings.roles.storageunit;

    $http.get('api/lookups/protocol')
     .then(function(response) {
         $scope.validProtocolsToAssign = response.data;
     });
    $http.get('api/lookups/lunos')
     .then(function(response) {
         $scope.validOSToAssign = response.data;
      });

    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.isUser = Authentication.user.roles.indexOf('user') !== -1;


    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
			var errMsg;
			//If error Message is a list of errors (object), show only the first error
			if(typeof message === 'object'){
				errMsg = message[Object.keys(message)[0]];
			} else {
				errMsg = message;
			}
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(errMsg) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    $scope.populateSG = function(server, callback) {
      $scope.storagegroups = [];
      $scope.storagegroupId = '';
      var storagegroups = Storagegroups.query({'file-server' : server});
      storagegroups.$promise.then(function(results) {
        angular.forEach(storagegroups, function(storagegroup) {
          if (storagegroup.server && storagegroup.server.id === server && storagegroup.status === 'Operational') {
            $scope.storagegroups.push(storagegroup);
          }
        });
        callback();
      });
    };

    $scope.populatevfas = function(tenant, callback) {
      $scope.servers = [];
      var servers = Servers.query();
      servers.$promise.then(function(results) {
        if (!tenant) {
          $scope.servers = servers;
        } else {
          angular.forEach(servers, function(server) {
            if (server.tenant && server.tenant._id === tenant) {
               $scope.servers.push(server);
            }
          });
        }        
        callback();
      });
    };

    // watchers to check the update of value and preselect the dropdown if only one value is present
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

    $scope.$watch("serverId", function(newVal, oldVal) {
      if (newVal) {
        $scope.populateSG(newVal, function() {
          if($scope.storagegroups.length === 1){
            $scope.storagegroupId = $scope.storagegroups[0].storagegroupId;
          }
        });        
      }        
    });

    $scope.initUpdate = function(acl) {
      Storageunits.get({
        storageunitId: $stateParams.storageunitId
      }, function(storageunit) {
          $scope.storageunit = storageunit;
          $scope.aclArray = $scope.storageunit.acl.split(',');
      });
    };

  	$scope.create = function(isValid) {
		 	if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'storageunitForm');
        return false;
      }

      // Create new storage unit object
      var storageunit = new Storageunits({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        storagegroupId: $sanitize(this.storagegroupId),
        sizegb: $sanitize(this.sizegb),
        acl: $sanitize(this.acl),
        protocol: $sanitize(this.protocol),
        lunOs: $sanitize(this.lunOs),
        lunId: $sanitize(this.lunId)
      });

      //Redirect to list page after save
      storageunit.$create(function (response) {
        $location.path('storageunits');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Unit Create request.<br>Please wait for the Status to change to Operational.</strong>', 10000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
        $scope.storagegroupId = '';
        $scope.sizegb = '';
        $scope.acl = '';
        $scope.protocol = '';
        $scope.lunOs = '';
        $scope.lunId = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
  	};

    // get the details of storage unit
    $scope.findOne = function () {
      Storageunits.get({
        storageunitId: $stateParams.storageunitId
      }, function(data) {
        $scope.storageunit = data;
        var acl_array = data.acl.split(',');        
        $scope.acl_array = acl_array.length >= 1 ? acl_array : [];
        // if(acl_array.length === 1 && !$scope.storageunit.aclRemove && acl_array[0] !==''){
        //   $scope.storageunit.aclRemove = acl_array[0];
        // }
      }, function(error) {
        $location.path('storageunits');
        throwFlashErrorMessage('No storage unit with that identifier has been found');
      });

       $http.get('api/lookups/suStatus')
        .then(function(response) {
          $scope.validStatusToAssign = response.data;
      });
    };

     // Update existing Storage unit
    $scope.update = function (isValid) {
      $scope.error = null;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'storageunitForm');
        return false;
      }
      var storageunit = $scope.storageunit;

      storageunit.$update(function () {
        $location.path('storageunits');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Unit Update request.<br>Please wait for the Status to return to Operational.</strong>', 10000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Remove existing Storage Unit
    $scope.remove = function (storageunit) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Storage Unit?',
        bodyText: ['Are you sure you want to delete the Storage Unit?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (storageunit) {
          storageunit.$remove(function (response) {
            $location.path('storageunits');
            Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Unit Delete request.<br>Please wait for the object to be removed from the list.</strong>', 10000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });

          for (var i in $scope.storageunits) {
            if ($scope.storageunits[i] === storageunit) {
              $scope.storageunits.splice(i, 1);
            }
          }
        }
      });
    };

    // Find a list of Storagegroups
    $scope.find = function () {
      //$scope.servers = Servers.query();
    };


    //Fix to be applied by root (managed services)
    $scope.fix = function () {
      var storageunit = $scope.storageunit;
      storageunit.fromFix = "true";
      storageunit.$update(function () {
        $location.path('storageunits');
        Flash.create('success', '<strong ng-non-bindable>Successfully fixed the Storagegroup!</strong>', 10000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    //Fix to be applied by root (managed services)
    // $scope.fix = function () {
    //   var storageunit = $scope.storageunit;  
    //   storageunit.fromFix = "true";
    //   storageunit.$update(function () {
    //     $location.path('storageunits');
    //     Flash.create('success', '<strong>Successfully fixed the Storage Unit!</strong>', 10000, { class: '', id: '' }, true);
    //   }, function (errorResponse) {
    //     Flash.create('danger', '<strong>' + errorResponse.data.message + '</strong>', 10000, { class: '', id: '' }, true);
    //   });
    // };

  }]);
