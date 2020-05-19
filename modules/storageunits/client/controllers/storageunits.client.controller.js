'use strict';

// Storage units controller

angular.module('storageunits')
	.controller('StorageunitsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Storageunits', 'Servers', 'Clusters', 'Flash', 'modalService', '$sanitize', 'Tags', 'Applications',
  function ($scope, $stateParams, $location, $http, Authentication, Storageunits, Servers, Clusters, Flash, modalService, $sanitize, Tags, Applications) {
  	$scope.authentication = Authentication;   
    $scope.servers = [];
    $scope.igroups = [];
    $scope.aggregates = [];
    $scope.labels = featuresSettings.labels;
    $scope.SUAccessRoles = featuresSettings.roles.storageunit;
    $scope.applications = Applications.query();
    $scope.tags = [{      
    }];

    $scope.serverName = "";
    $scope.clusterName = "";

    // $http.get('api/lookups/protocol')
    //  .then(function(response) {
    //      $scope.validProtocolsToAssign = response.data;
    //  });
    $http.get('api/lookups/lunos')
     .then(function(response) {
         $scope.validOSToAssign = response.data;
      });
    
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

    $scope.populateAggrs = function(cluster, callback) {
      $scope.aggregates = [];
      $scope.aggr =  '';

      angular.forEach($scope.clusters, function(clusterInfo) {
        if (clusterInfo.clusterId && clusterInfo.clusterId === cluster) {
          $scope.aggregates = clusterInfo.aggregates;
        }
      });
      
    };

    $scope.populateDestinationAggrs = function(cluster, callback) {
      $scope.destinationAggregates = [];
      $scope.destinationAggr =  '';

      angular.forEach($scope.clusters, function(clusterInfo) {
        if (clusterInfo.name && clusterInfo.name === cluster) {
          $scope.destinationAggregates = clusterInfo.aggregates;
        }
      });      
    };

    $scope.populatevfas = function(cluster, callback) {
      $scope.servers = [];
      var servers = Servers.query();
      servers.$promise.then(function(results) {
        if (!cluster) {
          $scope.servers = servers;
        } else {
          angular.forEach(servers, function(server) {
            if (server.cluster && server.cluster._id === cluster) {
               $scope.servers.push(server);
               $scope.clusterName = server.cluster.name;
            }
          });
        }        
        callback();
      });
    };

    $scope.populateIgroups = function(server) {
      $scope.igroups = [];
      var igroups = Storageunits.getIgroups({"vserverName": $scope.serverName, "clusterName": $scope.clusterName});
      igroups.$promise.then(function(results) {
        $scope.igroups = results;
      });
    };

    $scope.populateClusters = function(application) {
      $scope.clusters = [];
      var clusters = Clusters.query();
      clusters.$promise.then(function(results) {
        if (!application) {
          $scope.clusters = clusters;
        } else {
          angular.forEach(clusters, function(cluster) {
            if (cluster.applications.length > 0  && cluster.applications.includes(application)) {
               $scope.clusters.push(cluster);
            }
          });
        }        
        // callback();
      });
    }


    $scope.addTag = function() {
      $scope.tags.push({});
    }

    $scope.removeTag = function(index) {
      $scope.tags.splice(index, 1);
    }

    var prepareTagsObjectFromScope = function(scopeTags) {
      var tags = [];
      angular.forEach(scopeTags, function(tag) {
        var obj = {};
        obj[tag.attr] = tag.val
        tags.push(obj)
      });

      return tags;
    }

    $scope.checkboxChanged = function() {
      if ($scope.dr_enabled && $scope.serverName != "" && $scope.clusterName != "") {
        //query DB and get the peer relations
        var peers = Storageunits.getPeers({"vserverName":$scope.serverName, "clusterName":$scope.clusterName});
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
        $scope.populateClusters(newVal, function() {
          if($scope.clusters.length === 1){
            $scope.clusterId = $scope.clusters[0].clusterId;
          }
        });  
        $scope.populateAggrs(newVal);     
      }        
    });

    $scope.$watch("clusterId", function(newVal, oldVal) {
      if (newVal) {
        angular.forEach($scope.clusters, function(clusterDetail) {
          if (clusterDetail.clusterId && clusterDetail.clusterId === newVal) {
             $scope.showDrEnabledCheckBox = clusterDetail.dr_enabled;
          }
        });
        $scope.populatevfas(newVal, function() {
          if($scope.servers.length === 1){
            $scope.serverId = $scope.servers[0].serverId;
          }
        });  
        $scope.populateAggrs(newVal);     
      }        
    });

    $scope.$watch("serverId", function(newVal, oldVal) {
      if (newVal) {
        angular.forEach($scope.servers, function(serverDetail) {
          if (serverDetail.serverId && serverDetail.serverId === newVal) {
             $scope.serverName = serverDetail.name;
             serverDetail.protocols = serverDetail.protocols.replace('fcp', 'fc');
             $scope.validProtocolsToAssign = serverDetail.protocols.split(',');
             if ($scope.validProtocolsToAssign.indexOf("ndmp") >=0 ) {
              $scope.validProtocolsToAssign.splice($scope.validProtocolsToAssign.indexOf("ndmp"), 1);
             }
          }
        });
       
        $scope.populateIgroups(newVal, function() {
        });        
      }        
    });

    $scope.$watch("destinationCluster", function(newVal, oldVal) {
      if (newVal) {       
        $scope.populateDestinationAggrs(newVal.sourceCluster);     
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

      var tags = prepareTagsObjectFromScope(this.tags);

      
      // Create new storage unit object
      var storageunit = new Storageunits({
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
        destinationAggr:$sanitize(this.destinationAggr)
      });


      if(storageunit.protocol == "nfs") {
        storageunit.readWriteClients = $sanitize(this.aclReadWrite)
        storageunit.readOnlyClients = $sanitize(this.aclReadOnly)
      }

      
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


         if (tags.length > 0) {
          var tag = new Tags({'Tags': tags, objectId: response.storageunitId });
          tag.$create(function(response){
            console.log("response of tags", response)
          });
        }


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
        $scope.freshTag = false;
        var acl_array = data.acl.split(',');        
        $scope.acl_array = acl_array.length >= 1 ? acl_array : [];
        // if(acl_array.length === 1 && !$scope.storageunit.aclRemove && acl_array[0] !==''){
        //   $scope.storageunit.aclRemove = acl_array[0];
        // }

        //Get tags information
        Tags.get({
          objectId: $stateParams.storageunitId
        }, function(data) {
          data = data[0];
          if (data.tags.length > 0) {
            $scope.tags = [];
            angular.forEach(data.tags, function(tagVal, tagKey) {
              var obj = {};

              obj.attr = Object.keys(tagVal)[0];
              obj.val = tagVal[obj.attr];
              $scope.tags.push(obj);
            });           
          }
        }, function(error) {
            if(error.data.http_status_code == 404) {
              $scope.freshTag = true;
            }
            //throwFlashErrorMessage(error.data.message);
        });
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

      var tags = prepareTagsObjectFromScope(this.tags);

      storageunit.$update(function () {
        $location.path('storageunits');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Unit Update request.<br>Please wait for the Status to return to Operational.</strong>', 10000, { class: '', id: '' }, true);

        if (tags.length > 0) {
          var tag = new Tags({'Tags': tags, objectId: storageunit.storageunitId });

          var operation = '$update';

          if ($scope.freshTag) {
            operation = '$create';
          }
          tag[operation](function(response){
            console.log("response of tags update", response)
          });
        }
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
