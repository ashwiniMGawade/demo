'use strict';

// Backups controller
angular.module('backups').controller('BackupsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Backups', 'Storagegroups', 'Servers', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, Authentication, Backups, Storagegroups, Servers, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    var storagegroups = Storagegroups.query();
    var servers = Servers.query();
    $scope.backupAccessRoles = featuresSettings.roles.backup;

    $scope.servers = [];
    $scope.storagegroups = [];
    servers.$promise.then(function(results) {
      angular.forEach(results, function(server) {
        if (server.status == "Operational") {
            $scope.servers.push(server);
        }
      });
    });

    storagegroups.$promise.then(function(results) {
      angular.forEach(results, function(sg) {
        if (sg.status == "Operational" && sg.volume_type == 'primary') {
            $scope.storagegroups.push(sg);
        }
      });
    });
    
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


    $scope.monthsArray = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    $scope.weeksArray = [
      {id : 0, name: "sunday"},
      {id :1, name : "monday"},
      {id :2, name : "tuesday"},
      {id :3, name : "wednesday"}, 
      {id :4, name : "thursday"},
      {id :5, name : "friday"},
      {id :6, name : "saturday"}
    ];

    $scope.selectedMonths= [];

    $scope.defaultHourlySchedule = {
      "minute": 0,
      "keep": 0
    }

    $scope.defaultDailySchedule = {
      "hour": "",
      "minute": 0,
      "keep": 0
    }

    $scope.defaultWeeklySchedule = {
      "hour": 0,
      "minute": 0,
      "day_of_week":0,
      "keep": 0
    }

    $scope.defaultMonthlySchedule = {
      "hour": 0,
      "minute": 0,
      "day_of_month":0,
      "keep": 0
    }

    // $scope.backup_hourly_schedule = {}
    // $scope.backup_daily_schedule = {}
    // $scope.backup_weekly_schedule = {}
    // $scope.backup_monthly_schedule = {}

    
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

    var checkBackupPolicyErrors = function(scopeVar) {
      if (!(scopeVar.backupHourlyScheduleEnabled || scopeVar.backupDailyScheduleEnabled || scopeVar.backupWeeklyScheduleEnabled || scopeVar.backupMonthlyScheduleEnabled)) {
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

    $scope.showBKpolicy = false;

    $scope.toggleBackupPolicyView = function() {
      $scope.showBKpolicy = !$scope.showBKpolicy;
    }

    $scope.openBackupTab = function (evt, sname) {

      // Declare all variables
      var i, tabcontent, tablinks;

      $scope[sname+'ScheduleEnabled'] = !$scope[sname+'ScheduleEnabled'];

      if (sname == 'backupHourly') {
        $scope.backup_hourly_schedule = $scope.backup_hourly_schedule || $scope.defaultHourlySchedule;
        $scope.backup_hourly_schedule.keep = $scope.backup_hourly_schedule.keep || 0;
      }
      if (sname == 'backupDaily') {
        $scope.backup_daily_schedule = $scope.backup_daily_schedule || $scope.defaultDailySchedule;
        $scope.backup_daily_schedule.keep = $scope.backup_daily_schedule.keep || 0;
      }
      if (sname == 'backupWeekly') {
        $scope.backup_weekly_schedule = $scope.backup_weekly_schedule || $scope.defaultWeeklySchedule;
        $scope.backup_weekly_schedule.keep = $scope.backup_weekly_schedule.keep || 0;
      }
      if (sname == 'backupMonthly') {
        $scope.backup_monthly_schedule = $scope.backup_monthly_schedule || $scope.defaultMonthlySchedule;
        $scope.backup_monthly_schedule.keep = $scope.backup_monthly_schedule.keep || 0;
      }
      

      // Get all elements with class="tabcontent" and hide them
      tabcontent = document.getElementsByClassName("backuptabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }

      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("backuptablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }

      // Show the current tab, and add an "active" class to the button that opened the tab
      document.getElementById(sname).style.display = "block";
      evt.currentTarget.className += " active";

      if ($scope[sname+'ScheduleEnabled'] == true) {
        evt.currentTarget.className += " green";
      } else {
        evt.currentTarget.className = evt.currentTarget.className.replace(" green", "");
      }
    }


    // Create new Backup
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'backupForm');
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

    
      // Create new backup object
      var backup = new Backups({
        // code: $sanitize(this.code),
        source_volume_id: $sanitize(this.source_volume_id),
        destination_server_id: $sanitize(this.destination_server_id),
        schedule: {
          hour:this.hour ? $sanitize(this.hour): $sanitize(0),
          minute:this.minute ? this.minute : 0
        },
        policy: {
          enabled: true,
          hourly:{schedule: $scope.defaultHourlySchedule, keep: 0},
          daily: {schedule: $scope.defaultDailySchedule, keep: 0},
          weekly: {schedule: $scope.defaultWeeklySchedule,keep: 0},
          monthly:{schedule: $scope.defaultMonthlySchedule, keep: 0}
        }
      });



      
        if (this.backupHourlyScheduleEnabled) {
          backup.policy.hourly.schedule = this.backup_hourly_schedule ? this.backup_hourly_schedule : this.defaultHourlySchedule;
          backup.policy.hourly.keep  = this.backup_hourly_schedule.keep || 0;
        }

        if (this.backupDailyScheduleEnabled) {
          backup.policy.daily.schedule = this.backup_daily_schedule ? this.backup_daily_schedule : this.defaultDailySchedule;
          backup.policy.daily.keep  = this.backup_hourly_schedule.keep || 0;
        }
        if (this.backupWeeklyScheduleEnabled) {
          backup.policy.weekly.schedule = this.backup_weekly_schedule ? this.backup_weekly_schedule : this.defaultWeeklySchedule;
          backup.policy.weekly.keep  = this.backup_hourly_schedule.keep || 0;
        }

        if (this.backupMonthlyScheduleEnabled) {
          backup.policy.monthly.schedule = this.backup_monthly_schedule ? this.backup_monthly_schedule : this.defaultMonthlySchedule;
          backup.policy.monthly.keep  = this.backup_hourly_schedule.keep || 0;
        } 


      // Redirect after save
      backup.$create(function (response) {
        $location.path('backups');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the backup!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.source_volume_id = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!"); 
      });
    };

    // Remove existing Backup
    $scope.remove = function (backup) {
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
            throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!");           
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
      //delete backup.id;

     
      var ssResponse = checkBackupPolicyErrors(this);

      if (!ssResponse) {
        return false;
      }

        if (this.backupHourlyScheduleEnabled) {
          backup.policy.hourly.schedule = this.backup_hourly_schedule ? this.backup_hourly_schedule : this.defaultHourlySchedule;
          backup.policy.hourly.keep  = this.backup_hourly_schedule.keep || 0;
        }

        if (this.backupDailyScheduleEnabled) {
          backup.policy.daily.schedule = this.backup_daily_schedule ? this.backup_daily_schedule : this.defaultDailySchedule;
          backup.policy.daily.keep  = this.backup_hourly_schedule.keep || 0;
        }
        if (this.backupWeeklyScheduleEnabled) {
          backup.policy.weekly.schedule = this.backup_weekly_schedule ? this.backup_weekly_schedule : this.defaultWeeklySchedule;
          backup.policy.weekly.keep  = this.backup_hourly_schedule.keep || 0;
        }

        if (this.backupMonthlyScheduleEnabled) {
          backup.policy.monthly.schedule = this.backup_monthly_schedule ? this.backup_monthly_schedule : this.defaultMonthlySchedule;
          backup.policy.monthly.keep  = this.backup_hourly_schedule.keep || 0;
        }  

      backup.$update(function () {
        $location.path('backups');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the backup!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!"); 
      });
    };

    // Find a list of Pods
    $scope.find = function () {
      $scope.backups = Backups.query();
    };

    function prepareDetailedBackupPolicy(){
      $scope.detailedbackupDesc = "";
      if($scope.backupHourlyScheduleEnabled){
        $scope.detailedbackupDesc = $scope.detailedbackupDesc + "Hourly backups taken @ 00: "+$scope.backup_hourly_schedule.minute+" & Retained " + $scope.backup_hourly_schedule.keep + " backups \n";
      }
      if($scope.backupDailyScheduleEnabled){
        $scope.detailedbackupDesc = $scope.detailedbackupDesc + "Daily backups taken @ " + $scope.backup_daily_schedule.hour + 
        " hours past " +$scope.backup_daily_schedule.minute+ " minutes & Retained " + $scope.backup_daily_schedule.keep + " backups \n";
      }
      if($scope.backupWeeklyScheduleEnabled){
        $scope.detailedbackupDesc = $scope.detailedbackupDesc + "Weekly backups taken on every "+$scope.weeksArray[$scope.backup_weekly_schedule.day_of_week]["name"]+" @ "+$scope.backup_weekly_schedule.hour+":"+ $scope.backup_weekly_schedule.minute+ " & Retained " + $scope.backup_weekly_schedule.keep + " backups \n";
      }
      if($scope.backupMonthlyScheduleEnabled){
        $scope.detailedbackupDesc = $scope.detailedbackupDesc + "Monthly backups taken on every "+$scope.backup_monthly_schedule.day_of_month+"th of the month  @ "+$scope.backup_monthly_schedule.hour+":"+ $scope.backup_monthly_schedule.minute+ " & Retained " + $scope.backup_monthly_schedule.keep + " backups ";
      }
    }

    // Find existing Pod
    $scope.findOne = function () {
      Backups.get({
        backupId: $stateParams.backupId
      }, function(data) {
        $scope.backup = data;
        $scope.backup.backupId = $scope.backup.id;

        if(data.policy.enabled || data.policy.hourly.keep || data.policy.daily.keep || data.policy.weekly.keep || data.policy.monthly.keep){
          $scope.backup_hourly_schedule = data.policy.hourly.schedule;          
          $scope.backup_daily_schedule = data.policy.daily.schedule;
          $scope.backup_monthly_schedule = data.policy.monthly.schedule;
          $scope.backup_weekly_schedule = data.policy.weekly.schedule;

          $scope.backup_hourly_schedule.keep = data.policy.hourly.keep;
          $scope.backup_daily_schedule.keep = data.policy.daily.keep;
          $scope.backup_monthly_schedule.keep = data.policy.monthly.keep;
          $scope.backup_weekly_schedule.keep = data.policy.weekly.keep;


          $scope.backupHourlyScheduleEnabled = data.policy.hourly.keep > 0 ? true : false;
          $scope.backupDailyScheduleEnabled = data.policy.daily.keep > 0 ? true : false;
          $scope.backupWeeklyScheduleEnabled = data.policy.weekly.keep > 0 ? true : false;
          $scope.backupMonthlyScheduleEnabled = data.policy.monthly.keep > 0 ? true : false;
          //parseSnapShotPolicy(data.snapshot_policy);
          prepareDetailedBackupPolicy();
          
        }
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
