'use strict';

// Storage units controller

angular.module('eseries-storageunits')
	.controller('EseriesStorageunitsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'EseriesStorageunits', 'Servers', 'Systems', 'Flash', 'modalService', '$sanitize', 'Tags', 'Applications',
  function ($scope, $stateParams, $location, $http, Authentication, EseriesStorageunits, Servers, Systems, Flash, modalService, $sanitize, Tags, Applications) {
  	$scope.authentication = Authentication;   
    $scope.hostTypes = [];
    $scope.workloads = [];
    $scope.storagePools = [];
    $scope.labels = featuresSettings.labels;
    $scope.SUAccessRoles = featuresSettings.roles.storageunit;
    $scope.applications = Applications.query();
    $scope.port_info = [{      
    }];

    $scope.portPattern = /^((?:iqn\.[0-9]{4}-[0-9]{2}(?:\.[A-Za-z](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)+(?::[^,:]*)?)|(eui\.[0-9A-Fa-f]{16}))+(?:,((?:iqn\.[0-9]{4}-[0-9]{2}(?:\.[A-Za-z](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)+(?::[^,:]*)?)|(eui\.[0-9A-Fa-f]{16}))+)*$/
    $scope.serverName = "";
    $scope.clusterName = "";
    
    $scope.validProtocolsToAssign = ["fc", "iscsi"];
    $scope.validTargetsToAssign = ["host","group" ]
    
   
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.isUser = Authentication.user.roles.indexOf('user') !== -1;

    $scope.showDrEnabledCheckBox = false;


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

    $scope.populateSystems = function(application) {
      $scope.systems = [];
      var systems = Systems.query();
      systems.$promise.then(function(results) {
        if (!application) {
          $scope.systems = systems;
        } else {
          angular.forEach(systems, function(system) {
            if (system.applications.length > 0  && system.applications.includes(application)) {
               $scope.systems.push(system);
            }
          });
        }        
        // callback();
      });
    }


    $scope.addPort = function() {
      $scope.port_info.push({});
    }

    $scope.removePort = function(index) {
      $scope.port_info.splice(index, 1);
    }

    var preparePortInfoObjectFromScope = function(scopePorts) {
      var port_info = [];
      angular.forEach(scopePorts, function(portDetail) {
        var obj = {};
        obj[portDetail.label] = portDetail.val
        port_info.push(obj)
      });

      return port_info;
    }

    $scope.checkboxChanged = function() {
      if ($scope.dr_enabled && $scope.serverName != "" && $scope.clusterName != "") {
        //query DB and get the peer relations
        var peers = EseriesStorageunits.getPeers({"vserverName":$scope.serverName, "clusterName":$scope.clusterName});
        peers.$promise.then(function(results) {
          $scope.peers = results;
          if(results.length == 1) {
            $scope.destinationCluster = results[0]['peerCluster'];
            $scope.destinationVserver = results[0]['peerVserver']
          }
        });
      }
    }

    // watchers to check the update of value and preselect the dropdown if only one value is present
    
    $scope.$watch("applicationId", function(newVal, oldVal) {
      if (newVal) {
        $scope.populateSystems(newVal, function() {
          if($scope.systems.length === 1){
            $scope.systemId = $scope.systems[0].systemId;
          }
        });  
      }        
    });

    $scope.$watch("systemId", function(newVal, oldVal) {
      if (newVal) {
        angular.forEach($scope.systems, function(systemDetail) {
          if (systemDetail.systemId && systemDetail.systemId === newVal) {
            $scope.hostTypes = systemDetail.host_type;
            if ($scope.hostTypes.length == 1) {
              $scope.hostType = $scope.hostTypes[0].name
            }

            $scope.storagePools = systemDetail.storage_pool;           
            if ($scope.storagePools.length == 1) {
              $scope.storagePool = $scope.storagePools[0].name
            }

            $scope.workloads = systemDetail.workload;
            if ($scope.workloads.length == 1) {
              $scope.workload = $scope.workloads[0].name
            }
          }
        });
      }        
    });


    $scope.$watch("protocol", function(newVal, oldVal) {
      if (newVal) {
        if (newVal == "iscsi") {
          $scope.portPattern = /^((?:iqn\.[0-9]{4}-[0-9]{2}(?:\.[A-Za-z](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)+(?::[^,:]*)?)|(eui\.[0-9A-Fa-f]{16}))$/
          $scope.portPatternError = "Invalid port.  e.g. iqn.1992-05.com.microsoft:servername"
        } else {
          $scope.portPattern = /(([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2}))$/
          $scope.portPatternError = "Invalid port.  e.g. 10:00:00:00:56:78"
        }
        $scope.populateSystems(newVal, function() {
          if($scope.systems.length === 1){
            $scope.systemId = $scope.systems[0].systemId;
          }
        });  
      }        
    });

    $scope.initUpdate = function(acl) {
      EseriesStorageunits.get({
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

      var port_info = preparePortInfoObjectFromScope(this.port_info);

      
      // Create new storage unit object
      var storageunit = new EseriesStorageunits({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        clusterId: $sanitize(this.clusterId),
        serverId: $sanitize(this.serverId),
        aggr: $sanitize(this.aggr),
        sizegb: this.sizegb,
        protocol: $sanitize(this.protocol),
        applicationId:$sanitize(this.applicationId),
        dr_enabled:this.dr_enabled,
        destinationCluster:$sanitize(this.destinationCluster.peerCluster),
        destinationVserver:$sanitize(this.destinationVserver.peerVserver),
        destinationAggr:$sanitize(this.destinationAggr),
        schedule:$sanitize(this.schedule),
        port_info:$sanitize(port_info)
      });

     
      if(storageunit.protocol == "iscsi" || storageunit.protocol == "fc") {
        storageunit.mapping = this.mapping
        storageunit.acl = $sanitize(this.acl)
        storageunit.igroup = $sanitize(this.igroup)
        storageunit.lunOs =$sanitize(this.lunOs),
        storageunit.lunId = $sanitize(this.lunId)
      }
      //Redirect to list page after save
      storageunit.$create(function (response) {
        $location.path('storageunits');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Unit Create request.<br>Please wait for the Status to change to Operational.</strong>', 10000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
        $scope.sizegb = '';
        $scope.acl = '';
        $scope.protocol = '';
        storageunit.igroup = "";
        $scope.lunOs = '';
        $scope.lunId = '';
        storageunit.mapping = "";
        storageunit.readWriteClients = "";
        storageunit.readOnlyClients = "";

      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
  	};

    // get the details of storage unit
    $scope.findOne = function () {
      EseriesStorageunits.get({
        storageunitId: $stateParams.storageunitId
      }, function(data) {
        $scope.storageunit = data;
        $scope.freshTag = false;
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

      var port_info = prepareTagsObjectFromScope(this.port_info);
      storageunit.port_info = port_info;

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
