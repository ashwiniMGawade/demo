'use strict';

// Replicas controller
angular.module('replicas').controller('ReplicasController', ['$scope', '$stateParams', '$location', 'Authentication', 'Replicas', 'Storagegroups', 'Servers', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, Authentication, Replicas, Storagegroups, Servers, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.storagegroups = Storagegroups.query();
    $scope.servers = Servers.query();
    $scope.replicaAccessRoles = featuresSettings.roles.replica;


    $scope.monthsArray = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    $scope.weeksArray = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    $scope.selectedMonths= [];
    
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

    $scope.getDestinationServers = function(sg) {
      var sourceServerId = '';
      $scope.peeredServer = [];
      var peeredServerIds = [];
      var keepGoing = true;
      angular.forEach($scope.storagegroups, function(storagegroup) {
        if (storagegroup.id == sg && keepGoing) {
          sourceServerId = storagegroup.server.id;
          keepGoing = false;
        }
      });
      //Add source server as destination server
      peeredServerIds.push(sourceServerId);
      
      keepGoing = true;
      angular.forEach($scope.servers, function(server) {
        if (server.serverId == sourceServerId && keepGoing) {
          angular.forEach(server.peers, function(peer) {
            peeredServerIds.push(peer.serverId);
          });
          keepGoing = false;
        }
      });

      angular.forEach($scope.servers, function(server) {
        if (peeredServerIds.indexOf(server.serverId) !== -1 ) {
          $scope.peeredServer.push(server);
        }
      });
    }

    var checkBackupPolicyErrors = function(scopeVar) {
      if (scopeVar.backupPolicyEnabled && !(scopeVar.backupHourlyScheduleEnabled || scopeVar.backupDailyScheduleEnabled || scopeVar.backupWeeklyScheduleEnabled || scopeVar.backupMonthlyScheduleEnabled)) {
        throwFlashErrorMessage("Please enable at least one backup schedule with keep > 0");
        return false;
      }

      if (scopeVar.backupHourlyScheduleEnabled && scopeVar.backup_hourly_schedule.keep == 0) {
        throwFlashErrorMessage("Backup Hourly schedule: Keep should be greater than 0");
        return false;
      }

      if (scopeVar.backupDailyScheduleEnabled && scopeVar.backup_daily_schedule.keep == 0) {
        throwFlashErrorMessage("Backup Daily schedule: Keep should be greater than 0");
        return false;
      }

      if (scopeVar.backupWeeklyScheduleEnabled && scopeVar.backup_weekly_schedule.keep == 0) {
        throwFlashErrorMessage("Backup Weekly schedule: Keep should be greater than 0");
        return false;
      }

      if (scopeVar.backupMonthlyScheduleEnabled && scopeVar.backup_monthly_schedule.keep == 0) {
        throwFlashErrorMessage("Backup Monthly schedule: Keep should be greater than 0");
        return false;
      }
      //need to remove the line once the modification is done in model
      if (scopeVar.backupDailyScheduleEnabled) {
        scopeVar.backup_daily_schedule.hour = $sanitize(scopeVar.backup_daily_schedule.hour);
      }

      return true
    }

    // Create new Replica
    $scope.create = function (isValid) {

      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'replicaForm');
        return false;
      }

      var backupPolicyResponse = checkBackupPolicyErrors(this);

      if (!backupPolicyResponse) {
        return false;
      }

      /*
      let months = [];
      for (const key of Object.keys($scope.selectedMonths)) {
        if ($scope.selectedMonths[key] == true) {
          months.push(key);
        }
      }

      console.log(months);     

      */

    
      // Create new Replica object
      var replica = new Replicas({
        // code: $sanitize(this.code),
        source_volume_id: $sanitize(this.sourceVolumeId),
        destination_server_id: $sanitize(this.destinationServerId),
        schedule: {
          hour:this.hour ? $sanitize(this.hour): $sanitize(0),
          minute:this.minute ? this.minute : 0
        }
      });


      // Redirect after save
      replica.$create(function (response) {
        $location.path('replicas');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the replica!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.source_volume_id = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!"); 
      });
    };

    // Remove existing Replica
    $scope.remove = function (replica) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Replica?',
        bodyText: ['Are you sure you want to delete this Replica?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (replica) {
          replica.$remove(function (response) {
            $location.path('replicas');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the replica!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!");           
          });

          for (var i in $scope.replicas) {
            if ($scope.replicas[i] === pod) {
              $scope.replicas.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Replica
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'replicaForm');

        return false;
      }

      var replica = $scope.replica;      
      delete replica.destination_server_id;
      delete replica.destination_volume_id;
      delete replica.destination_site_id;
      delete replica.source_server_id;
      delete replica.source_volume_id;
      delete replica.source_site_id; 
      delete replica.state;
      delete replica.status;
      
      replica.$update(function () {
        $location.path('replicas');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the replica!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!"); 
      });
    };

    // Find a list of Pods
    $scope.find = function () {
      $scope.replicas = Replicas.query();
    };

    // Find existing Pod
    $scope.findOne = function () {
      Replicas.get({
        replicaId: $stateParams.replicaId
      }, function(data) {
        $scope.replica = data;
        $scope.replica.replicaId = $scope.replica.id;
        //MODIFY THE HOUR FORMAT
        var a = data.schedule.hour.split(",");
        var stripped_hour_array = [];
        a.forEach(function(n) {
          stripped_hour_array.push(parseInt(n));
        });
        $scope.replica.schedule.hour = stripped_hour_array.join(",");
      }, function(error){
        $location.path('replicas');
        throwFlashErrorMessage('No replica with that identifier has been found');
      });
    };
  }
]);
