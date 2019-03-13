'use strict';

// Servers controller
angular.module('servers').controller('ServersController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Servers', 'Tags', 'Subtenants', 'Sites', 'Pods', 'Subscriptions', 'modalService', 'Flash', 'Tenants', '$sanitize', 
  function ($scope, $stateParams, $location, $http, Authentication, Servers, Tags, Subtenants, Sites, Pods, Subscriptions, modalService, Flash, Tenants, $sanitize) {
    $scope.authentication = Authentication;
    $scope.sites = Sites;
    $scope.subtenants = Subtenants;
    $scope.serverSettings = featuresSettings.server;
    $scope.subscriptions = Subscriptions.query();
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.labels = featuresSettings.labels;
    $scope.tags = [{      
    }];
    $scope.serverAccessRoles = featuresSettings.roles.server;
    $scope.popoverMsg = "Please enter a passphrase or password with greater than 8 characters and maximum of 16 characters, no special characters, at least a digit and a letter."
    
    var flashTimeout = 10000;

    function throwFlashErrorMessage(message) {
      var errMsg =  message;
      //If error Message is a list of errors (object), show only the first error
      if(typeof message === 'object'){
        errMsg = message[Object.keys(message)[0]];
      }
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(errMsg) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    if($scope.isRoot) {
      $scope.tenants = Tenants.query();
      $scope.pods = Pods.query();
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
        $scope.populateSubtenant(newVal, function() {
          if($scope.subtenants.length === 1){
            $scope.subtenantId = $scope.subtenants[0].subtenantId;
          }
        });
        $scope.populateSubscriptions($scope.siteId, newVal, function() {
          if($scope.subscriptions.length === 1){
            $scope.subscriptionId = $scope.subscriptions[0].subscriptionId;
          }
        });
      }
    });

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
   
    // Create new Server
    $scope.create = function (isValid) {
      
      var tags = prepareTagsObjectFromScope(this.tags);

      console.log(tags);

      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'serverForm');
        return false;
      }

      // Create new Server object
      var server = new Servers({
        name: $sanitize(this.name),
        subtenantId: $sanitize(this.subtenantId),
        siteId: $sanitize(this.siteId),
        vlan: $sanitize(this.vlan),
        subnet: $sanitize(this.subnet),
        gateway: $sanitize(this.gateway),
        subscriptionId: $sanitize(this.subscriptionId)
      });

      

      // Redirect to list page after save
      server.$create(function (response) {
        $location.path('servers');
        Flash.create('success', '<strong ng-non-bindable>Submitted the ' + $scope.labels.server.serverName + ' Create request.<br>Please wait for the Status to change to Operational.</strong>', 10000, { class: '', id: '' }, true);

        if (tags.length > 0) {
          var tag = new Tags({'Tags': tags, objectId: response._id });
          tag.$create(function(response){
            console.log("response of tags", response)
          });
        }

        // Clear form fields
        $scope.name = '';
        $scope.subtenantId = '';
        $scope.siteId = '';
        $scope.vlan = '';
        $scope.subnet = '';
        $scope.gateway = '';
        $scope.subscriptionId = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Remove existing Server
    $scope.remove = function (server) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete ' + $scope.labels.server.serverName + '?',
        bodyText: [ 'Are you sure you want to delete the ' + $scope.labels.server.serverName + '?',
                    'NOTE: If any volumes exist with the ' + $scope.labels.server.serverName + ', the deletion process will not complete successfully and billing will continue. Please ensure that all data has been successfully vacated from systems, as this is a non-recoverable event.' ]
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (server) {
          server.$remove(function (response) {
            $location.path('servers');
            Flash.create('success', '<strong ng-non-bindable>Submitted the ' + $scope.labels.server.serverName + ' Delete request.<br>Please wait for the object to be removed from the list.</strong>', 10000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });

          for (var i in $scope.servers) {
            if ($scope.servers[i] === server) {
              $scope.servers.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Server
    $scope.update = function (isValid) {
      $scope.error = null;
      var tags = prepareTagsObjectFromScope(this.tags);
      console.log(tags);

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'serverForm');
        return false;
      }

      var server = $scope.server;
      // Saving the state of nfs,cifs,iscsi from local to model
      server.cifs = $scope.cifs;
      server.nfs = $scope.nfs;
      server.iscsi = $scope.iscsi;
      server.subscriptionId = $scope.subscriptionId;

      server.$update(function () {
        $location.path('servers');
        Flash.create('success', '<strong ng-non-bindable>Submitted the ' + $scope.labels.server.serverName + ' Update request.<br>Please wait for the Status to return to Operational.</strong>', 10000, { class: '', id: '' }, true);

        if (tags.length > 0) {
          var tag = new Tags({'Tags': tags, objectId: server._id });
          tag.$update(function(response){
            console.log("response of tags update", response)
          });
        }

      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
        server.cifs = Servers.get({ serverId: $stateParams.serverId}).cifs;
      });
    };

    // Find a list of Servers
    $scope.find = function () {
      $scope.servers = Servers.query();
      $scope.subtenants = Subtenants.query();
      $scope.sites = Sites.query();      
    };

    // Find existing Server
    $scope.findOne = function () {
      Servers.get({
        serverId: $stateParams.serverId
      }, function(data) {
        $scope.server = data;
        $scope.cifs = $scope.server.cifs;
        $scope.nfs = $scope.server.nfs;
        $scope.iscsi = $scope.server.iscsi;
        $scope.populateSubscriptions($scope.server.site._id, $scope.server.tenant._id, function() {
          $scope.subscriptionId = $scope.server.subscription ? $scope.server.subscription._id : '';
          if($scope.subscriptions.length === 1 && !$scope.subscriptionId){
            $scope.subscriptionId = $scope.subscriptions[0].subscriptionId;
          }
        });

        //Get tags information
        Tags.get({
          objectId: $stateParams.serverId
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
            console.log($scope.tags)            
          }
        }, function(error) {
            throwFlashErrorMessage(error.data.message);
        });
      }, function(error){
        $location.path('servers');
        throwFlashErrorMessage(error.data.message);
      });

      $http.get('api/lookups/status')
        .then(function(response) {
          $scope.validStatusToAssign = response.data;
      });
    };

    //Fix to be applied by root (managed services)
    $scope.fix = function (isValid) {
      $scope.error = null;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'serverForm');
        return false;
      }
      var server = $scope.server;
      server.fromFix = "true";
      server.podId = server.pod;
      delete server.pod;
      server.$update(function () {
        $location.path('servers');
        Flash.create('success', '<strong ng-non-bindable>Successfully fixed the ' + $scope.labels.server.serverName + '!</strong>', 10000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    $scope.populateSubtenant = function(tenant, callback) {
      var subtenants = Subtenants.query();
      if (!tenant) {
        $scope.subtenants = subtenants;
      } else {
        $scope.subtenants = [];
        $scope.subtenantId = '';
        subtenants.$promise.then(function(results) {
          angular.forEach(subtenants, function(subtenant) {
            if (subtenant.tenant && subtenant.tenant._id === tenant) {
              $scope.subtenants.push(subtenant);
            }
          });
          callback();
        });
      }
    };

    $scope.populateSubscriptions = function(site, tenant, callback) {
      var subscriptions = Subscriptions.query();
      tenant = tenant || $scope.authentication.user.tenant;
      $scope.subscriptions = [];
      if (tenant) {
        $scope.subscriptionId = '';
        subscriptions.$promise.then(function(results) {
          angular.forEach(subscriptions, function(subscription) {
            if (subscription.tenant && subscription.tenant._id === tenant) {
              if (subscription.site) {
                if (subscription.site._id === site) {
                  $scope.subscriptions.push(subscription);
                }
              } else {
                $scope.subscriptions.push(subscription);
              }
            }
          });
          callback();
        });
      }
    };
  }
]);
