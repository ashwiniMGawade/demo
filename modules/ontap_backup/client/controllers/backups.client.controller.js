'use strict';

// Backups controller
angular.module('backups').controller('BackupsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Backups', 'Storagegroups', 'Servers', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, Authentication, Backups, Storagegroups, Servers, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.storagegroups = Storagegroups.query();
    $scope.servers = Servers.query();
    $scope.backupAccessRoles = featuresSettings.roles.backup;


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

    // Create new Backup
    $scope.create = function (isValid) {
      console.log(this);

      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'backupForm');
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

    
      // Create new backup object
      var backup = new Backups({
        // code: $sanitize(this.code),
        source: $sanitize(this.sourceVolumeId),
        destination: $sanitize(this.destinationServerId),
        backup_policy: {
          enabled:bkPolicyEnabled,
          hourly_schedule: this.hourly_schedule,
          daily_schedule: this.daily_schedule,
          weekly_schedule: this.weekly_schedule,
          monthly_schedule:this.monthly_schedule
        }
      });


      // Redirect after save
      backup.$create(function (response) {
        $location.path('backups');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the backup!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.source_volume_id = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message); 
      });
    };

    // Remove existing Backup
    $scope.remove = function (Backup) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Backup?',
        bodyText: ['Are you sure you want to delete this Backup?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (backup) {
          backup.$remove(function (response) {
            $location.path('backups');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the backup!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.user_message);           
          });

          for (var i in $scope.backups) {
            if ($scope.backups[i] === pod) {
              $scope.backups.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Backup
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'backupForm');

        return false;
      }

      var backup = $scope.backup;      
      delete backup.destination_server_id;
      delete backup.destination_volume_id;
      delete backup.destination_site_id;
      delete backup.source_server_id;
      delete backup.source_volume_id;
      delete backup.source_site_id; 
      delete backup.state;
      delete backup.status;
      delete backup.id;

      backup.$update(function () {
        $location.path('backups');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the backup!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message); 
      });
    };

    // Find a list of Pods
    $scope.find = function () {
      $scope.backups = Backups.query();
    };

    // Find existing Pod
    $scope.findOne = function () {
      Backups.get({
        backupId: $stateParams.backupId
      }, function(data) {
        $scope.backup = data;
        $scope.backup.backupId = $scope.backup.id;
        //MODIFY THE HOUR FORMAT
        var a = data.schedule.hour.split(",");
        var stripped_hour_array = [];
        a.forEach(function(n) {
          stripped_hour_array.push(parseInt(n));
        });
        $scope.backup.schedule.hour = stripped_hour_array.join(",");
      }, function(error){
        $location.path('backups');
        throwFlashErrorMessage('No backup with that identifier has been found');
      });
    };
  }
]);
