'use strict';

// Storagegroups controller
angular.module('storagegroups').controller('StoragegroupsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Storagegroups', 'Tags', 'Snapshots', 'Servers', 'modalService', 'Flash', 'Tenants', '$sanitize',  function ($scope, $stateParams, $location, $http, Authentication, Storagegroups, Tags, Snapshots, Servers, modalService, Flash, Tenants, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.isUser = Authentication.user.roles.indexOf('user') !== -1;
    $scope.labels = featuresSettings.labels;
    $scope.tags = [{      
    }];
    $scope.SGAccessRoles = featuresSettings.roles.storagegroup;
    $scope.snapshotAccessRoles = featuresSettings.roles.snapshot;
    $scope.showSSpolicy = false;

    $http.get('api/lookups/performanceServiceLevels')
      .then(function(response) {
        $scope.validPerformanceSLToAssign = response.data;
    });

    $http.get('api/lookups/protectionServiceLevels')
      .then(function(response) {
        $scope.validProtectionSLToAssign = response.data;
    });

    $scope.showReplicaForm = false;
    $scope.showBackupForm = false;
    $scope.mode = 'fresh';
    $scope.tier = 'performance';

    var flashTimeout = 3000;

    $scope.weeksArray = [
      {id : 0, name: "sunday"},
      {id :1, name : "monday"},
      {id :2, name : "tuesday"},
      {id :3, name : "wednesday"}, 
      {id :4, name : "thursday"},
      {id :5, name : "friday"},
      {id :6, name : "saturday"}
    ];

    $scope.hourlyScheduleEnabled = false;
    $scope.dailyScheduleEnabled = false;
    $scope.weeklyScheduleEnabled = false;
    $scope.monthlyScheduleEnabled = false;

    $scope.backupHourlyScheduleEnabled = false;
    $scope.backupDailyScheduleEnabled = false;
    $scope.backupWeeklyScheduleEnabled = false;
    $scope.backupMonthlyScheduleEnabled = false;

    $scope.defaultHourlySchedule = {
       "minute": 0,
      "snapshots_to_keep": 0
    }

    $scope.defaultDailySchedule = {
      "hour": "0",
      "minute": 0,
      "snapshots_to_keep": 0
    }

    $scope.defaultWeeklySchedule = {
      "hour": 0,
      "minute": 0,
      "day_of_week":0,
      "snapshots_to_keep": 0
    }

    $scope.defaultMonthlySchedule =  {
      "hour": 0,
      "minute": 0,
      "day_of_month":1,
      "snapshots_to_keep": 0
    }



    var sshourly_schedule = {
      "minute": 20,
      "snapshots_to_keep": 0
    }

    var ssdaily_schedule = {
      "hour": "0,4,8,12",
      "minute": 30,
      "snapshots_to_keep": 28
    }

    var ssweekly_schedule =  {
      "hour": 0,
      "minute": 5,
      "day_of_week":0,
      "snapshots_to_keep": 1
    }

    var ssmonthly_schedule =  {
      "hour": 20,
      "minute": 45,
      "day_of_month":15,
      "snapshots_to_keep": 1
    }



    $scope.backup_hourly_schedule = {
      "minute": 0,
      "keep":0
    }

    $scope.backup_daily_schedule = {
      "hour":"21",
      "minute":5,
      "keep": 30
    }

    $scope.backup_weekly_schedule = {
      "day_of_week":0,
      "hour":6,
      "minute":5,
      "keep": 1
    }

    $scope.backup_monthly_schedule = {
      "day_of_month":1,
      "hour":8,
      "minute":5,
      "keep": 3
    }

    $scope.backup_schedule = {
      "hour":"20",
      "minute":5
    }

    $scope.replica_schedule = {
      "hour":"12",
      "minute":5
    }


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

    $scope.toggleMode = function() {
      if ($scope.existingVolumeModeEnabled) {
        $scope.mode = 'exisitingVolume';
      } else {
        $scope.mode = 'fresh';
      }
    }


    $scope.openSnapshotTab = function (evt, sname) {

      // Declare all variables
      var i, tabcontent, tablinks;

      $scope[sname.toLowerCase()+'ScheduleEnabled'] = !$scope[sname.toLowerCase()+'ScheduleEnabled'];

      if (sname == 'Hourly') {
        $scope.hourly_schedule = $scope.hourly_schedule || $scope.defaultHourlySchedule;
      }
      if (sname == 'Daily') {
        $scope.daily_schedule = $scope.daily_schedule || $scope.defaultDailySchedule;
      }
      if (sname == 'Weekly') {
        $scope.weekly_schedule = $scope.weekly_schedule || $scope.defaultWeeklySchedule;
      }
      if (sname == 'Monthly') {
        $scope.monthly_schedule = $scope.monthly_schedule|| $scope.defaultMonthlySchedule;
      }

      // Get all elements with class="tabcontent" and hide them
      tabcontent = document.getElementsByClassName("sstabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }

      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("sstablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }

      // Show the current tab, and add an "active" class to the button that opened the tab
      document.getElementById(sname).style.display = "block";
      evt.currentTarget.className += " active";

      if ($scope[sname.toLowerCase()+'ScheduleEnabled'] == true) {
        evt.currentTarget.className += " green";
      } else {
        evt.currentTarget.className = evt.currentTarget.className.replace(" green", "");
      }
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
        console.log("called here")
        evt.currentTarget.className = evt.currentTarget.className.replace(" green", "");
      }
    }

    
    function prepareDetailedSnapShotPolicy(){
      $scope.detailedSnapShotDesc = "";
      if($scope.hourlyScheduleEnabled){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Hourly snapshots taken @ 00: "+$scope.hourly_schedule.minute+" & Retained " + $scope.hourly_schedule.snapshots_to_keep + " Snapshots \n";
      }
      if($scope.dailyScheduleEnabled){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Daily snapshots taken @ " + $scope.daily_schedule.hour + 
        " hours past " +$scope.daily_schedule.minute+ " minutes & Retained " + $scope.daily_schedule.snapshots_to_keep + " Snapshots \n";
      }
      if($scope.weeklyScheduleEnabled){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Weekly snapshots taken on every "+$scope.weeksArray[$scope.weekly_schedule.day_of_week]["name"]+" @ "+$scope.weekly_schedule.hour+":"+ $scope.weekly_schedule.minute+ " & Retained " + $scope.weekly_schedule.snapshots_to_keep + " Snapshots \n";
      }
      if($scope.monthlyScheduleEnabled){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Monthly snapshots taken on every "+$scope.monthly_schedule.day_of_month+"th of the month  @ "+$scope.monthly_schedule.hour+":"+ $scope.monthly_schedule.minute+ " & Retained " + $scope.monthly_schedule.snapshots_to_keep + " Snapshots ";
      }
    }

    var getvFAS = function(tenant, servers) {
      var serverList = [];
      if (!tenant) {
        serverList = servers;
      } else {
        angular.forEach(servers, function(server) {
          if (server.tenant && server.tenant._id === tenant  && server.status === 'Operational') {
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

    $scope.setVarsAsPerDPlevel = function (dp) {
      $scope.showReplicaForm = false;
      $scope.showBackupForm = false;

      if (!dp.length) {
        $scope.hourly_schedule =  $scope.defaultHourlySchedule;
        $scope.daily_schedule =  $scope.defaultDailySchedule;
        $scope.weekly_schedule =  $scope.defaultWeeklySchedule;
        $scope.monthly_schedule =  $scope.defaultMonthlySchedule;
      } else {
        $scope.hourly_schedule =  sshourly_schedule;
        $scope.daily_schedule = ssdaily_schedule;
        $scope.weekly_schedule =  ssweekly_schedule;
        $scope.monthly_schedule = ssmonthly_schedule
      }
      if(dp[0].has_mirror) {
        $scope.showReplicaForm = true;
        getDestinationServers($scope.serverId)
      } 
      if(dp[0].has_vault) {
        $scope.showBackupForm = true;
      }
    }

    var getDestinationServers = function(sourceServerId) {
      
      $scope.peeredServer = [];
      var peeredServerIds = [];
      var keepGoing = true;
      
      //Add source server as destination server
      peeredServerIds.push(sourceServerId);
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

    var getStoragegroupsForClone = function(sourceServerId) {
      var storagegroups = Storagegroups.query({'server': sourceServerId});
      var storagegroupList  = [];
      storagegroups.$promise.then(function(results) {
          angular.forEach(results, function(sg) {
            if (sg.status === 'Operational' && sg.snapshot_policy.enabled==true) {
               storagegroupList.push(sg);
            }
          });
        });
      $scope.storagegroups = storagegroupList;
    } 

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
        getDestinationServers(newVal);
        getStoragegroupsForClone(newVal)
      }
    });

    $scope.$watch("create_from_volume", function(newVal, oldVal) {
      if (newVal) {
        getSnapshots(newVal);
      }
    });
 
    var getSnapshots = function(sg) {
      Snapshots.query({storagegroupId : sg.id}, function (data) {
        $scope.snapshots = data;
      });
    }

    var checkSnapshotPolicyErrors = function(scopeVar) {
      // if (!scopeVar.dp && !(scopeVar.hourlyScheduleEnabled || scopeVar.dailyScheduleEnabled || scopeVar.weeklyScheduleEnabled || scopeVar.monthlyScheduleEnabled)) {
      //   throwFlashErrorMessage("Please enable at least one schedule with Snapshots to keep > 0");
      //   return false;
      // }

      if (scopeVar.hourlyScheduleEnabled && scopeVar.hourly_schedule.snapshots_to_keep == 0) {
        throwFlashErrorMessage("Hourly schedule: Snapshots to keep should be greater than 0");
        return false;
      }

      if (scopeVar.dailyScheduleEnabled && scopeVar.daily_schedule.snapshots_to_keep == 0) {
        throwFlashErrorMessage("Daily schedule: Snapshots to keep should be greater than 0");
        return false;
      }

      if (scopeVar.weeklyScheduleEnabled && scopeVar.weekly_schedule.snapshots_to_keep == 0) {
        throwFlashErrorMessage("Weekly schedule: Snapshots to keep should be greater than 0");
        return false;
      }

      if (scopeVar.monthlyScheduleEnabled && scopeVar.monthly_schedule.snapshots_to_keep == 0) {
        throwFlashErrorMessage("Monthly schedule: Snapshots to keep should be greater than 0");
        return false;
      }
      //need to remove the line once the modification is done in model
      if (scopeVar.dailyScheduleEnabled) {
        scopeVar.daily_schedule.hour = $sanitize(scopeVar.daily_schedule.hour);
      }

      return true
    }

    var checkBackupPolicyErrors = function(scopeVar) {

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

    // Create new Storagegroup
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'volumeForm');
        return false;
      }

      var ssResponse = checkSnapshotPolicyErrors(this);

      if (!ssResponse) {
        return false;
      }

      var backupPolicyResponse = checkBackupPolicyErrors(this);

      if (!backupPolicyResponse) {
        return false;
      }

      var tags = prepareTagsObjectFromScope(this.tags);
      
      //var formattedSanpShotPolicy = formatSnapShotPolicy();
      // Create new Storagegroup object
      var storagegroup = new Storagegroups({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        server_id: $sanitize(this.serverId),
        tier: $sanitize(this.tier),       
        // size_bytes:this.size_bytes,
        snapshot_policy: {
          enabled: !this.dp && !(this.hourlyScheduleEnabled || this.dailyScheduleEnabled || this.weeklyScheduleEnabled || this.monthlyScheduleEnabled) ? false : true,
          hourly_schedule : this.hourly_schedule ,
          daily_schedule : this.daily_schedule ,
          weekly_schedule : this.weekly_schedule ,
          monthly_schedule : this.monthly_schedule
        }
      });

      if(this.create_from_volume && this.mode !='fresh') {
        storagegroup.create_from_volume=$sanitize(this.create_from_volume.id);
        storagegroup.clone_snapshot_name=$sanitize(this.clone_snapshot_name);
        if(this.ssPolicyFromClonnedVolume) {
          storagegroup.snapshot_policy = this.create_from_volume.snapshot_policy;
        }
      }

      if ( this.protection_service_level && this.mode =='fresh') {
        storagegroup.protection_service_level = this.protection_service_level == 'administrative' ? null : $sanitize(this.protection_service_level)
      } 


      if (this.showReplicaForm && this.mode =='fresh') {
        storagegroup.replica_destination_server_id = $sanitize(this.replica_destination_server_id)
        storagegroup.replica_schedule =  {
          hour: this.replica_schedule && this.replica_schedule.hour ? $sanitize(this.replica_schedule.hour): $sanitize(0),
          minute: this.replica_schedule && this.replica_schedule.minute ? this.replica_schedule.minute : 0
        }
      }

      if (this.showBackupForm && this.mode =='fresh') {
        storagegroup.backup_destination_server_id = $sanitize(this.backup_destination_server_id)
        storagegroup.backup_schedule =  {
          hour: this.backup_schedule && this.backup_schedule.hour ? $sanitize(this.backup_schedule.hour): $sanitize(0),
          minute: this.backup_schedule && this.backup_schedule.minute ? this.backup_schedule.minute : 0
        };
        storagegroup.backup_policy =  {
          enabled:true,
          hourly: {schedule: $scope.backup_hourly_schedule, keep: 0},
          daily: {schedule: $scope.backup_daily_schedule, keep: 0},
          monthly: {schedule: $scope.backup_monthy_schedule, keep: 0},
          weekly: {schedule: $scope.backup_weekly_schedule, keep: 0}
        }
      }


      if (this.backupPolicyEnabled && this.mode =='fresh') {
        if (this.backupHourlyScheduleEnabled) {
          storagegroup.backup_policy.hourly.schedule = this.backup_hourly_schedule ? this.backup_hourly_schedule : this.defaultHourlySchedule;
          storagegroup.backup_policy.hourly.keep  = this.backup_hourly_schedule.keep || 0;
        }

        if (this.backupDailyScheduleEnabled) {
          storagegroup.backup_policy.daily.schedule = this.backup_daily_schedule ? this.backup_daily_schedule : this.defaultDailySchedule;
          storagegroup.backup_policy.daily.keep  = this.backup_hourly_schedule.keep || 0;
        }
        if (this.backupWeeklyScheduleEnabled) {
          storagegroup.backup_policy.weekly.schedule = this.backup_weekly_schedule ? this.backup_weekly_schedule : this.defaultWeeklySchedule;
          storagegroup.backup_policy.weekly.keep  = this.backup_hourly_schedule.keep || 0;
        }

        if (this.backupMonthlyScheduleEnabled) {
          storagegroup.backup_policy.monthly.schedule = this.backup_monthly_schedule ? this.backup_monthly_schedule : this.defaultMonthlySchedule;
          storagegroup.backup_policy.monthly.keep  = this.backup_hourly_schedule.keep || 0;
        }       
        
      }

      console.log(storagegroup);
      


      // Redirect after save
      storagegroup.$create(function (response) {
        $location.path('storagegroups');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Group Create request.<br>Please wait for the Status to change to Operational.</strong>', 10000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
        $scope.annotation = '';
        $scope.serverId = '';
        $scope.tier = '';
        $scope.snapshot_policy = {};

        if (tags.length > 0) {
          var tag = new Tags({'Tags': tags, objectId: response.object_id });
          tag.$create(function(response){
            console.log("response of tags", response)
          });
        }


      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || errorResponse.data.error || "Something went wrong!");
      });
    };

    $scope.toggleSnapshotPolicyClone = function() {
      // if (this.mode !== 'fresh') {         
      //       this.ssPolicyEnabled = this.ssPolicyFromClonnedVolume ? false: this.ssPolicyEnabled
      //     }
      }

    $scope.toggleSnapshotPolicyView = function() {
      $scope.showSSpolicy = !$scope.showSSpolicy;
      // if (this.mode !== 'fresh') {         
      //       this.ssPolicyFromClonnedVolume = this.ssPolicyEnabled ? false : this.ssPolicyFromClonnedVolume
      //     }

    }

    $scope.toggleBackupPolicyView = function() {
      $scope.showBKpolicy = !$scope.showBKpolicy;
    }
    // Create new SnapShots
    $scope.createSnapshot = function (storagegroup) {
      $scope.error = null;
      var storagegroupId = storagegroup.id;
      var snapshots = new Snapshots({
        storagegroupId : storagegroupId
      });

      // Redirect after save
      snapshots.$create(function (response) {
        $location.path( '/storagegroups/' + storagegroupId + '/snapshots');
        Flash.create('success', '<strong ng-non-bindable>Snapshot Create request accepted. Please wait and list the Snapshots in a 10 seconds or so.</strong>', 10000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!");
      });
    };

    // Remove existing Subtenant
    $scope.remove = function (storagegroup) {
      storagegroup.storagegroupId = storagegroup.id;
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Storage Group?',
        bodyText: [ 'Are you sure you want to delete the Storage Group?',
                    'NOTE: If any volumes exist with the Storage Group, the deletion process will not complete successfully and billing will continue. Please ensure that all data has been successfully vacated from systems, as this is a non-recoverable event.' ]
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        if (storagegroup) {
          storagegroup.$remove(function (response) {
            $location.path('storagegroups');
            Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Group Delete request.<br>Please wait for the object to be removed from the list.</strong>', 10000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!");
          });

          for (var i in $scope.storagegroups) {
            if ($scope.storagegroups[i] === storagegroup) {
              $scope.storagegroups.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Storagegroup
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'volumeForm');
        return false;
      }

      if ($scope.storagegroup.volume_type != 'mirror') {
         var ssResponse = checkSnapshotPolicyErrors(this);

        if (!ssResponse) {
          return false;
        }
      }
      
      var tags = prepareTagsObjectFromScope(this.tags);
      
      var storagegroup = $scope.storagegroup;
      storagegroup.storagegroupId = storagegroup.id;
      storagegroup.snapshot_policy = {
          enabled: !this.dp && !(this.hourlyScheduleEnabled || this.dailyScheduleEnabled || this.weeklyScheduleEnabled || this.monthlyScheduleEnabled) ? false : true,
          hourly_schedule : this.hourly_schedule ? this.hourly_schedule : (!this.dp.length ? this.defaultHourlySchedule:sshourly_schedule),
          daily_schedule : this.daily_schedule ? this.daily_schedule : (!this.dp.length ? this.defaultDailySchedule : ssdaily_schedule),
          weekly_schedule : this.weekly_schedule ? this.weekly_schedule : (!this.dp.length ? this.defaultWeeklySchedule :ssweekly_schedule),
          monthly_schedule : this.monthly_schedule ? this.monthly_schedule : (!this.dp.length ? this.defaultMonthlySchedule : ssmonthly_schedule)
      }


      storagegroup.$update(function (response) {
        $location.path('storagegroups');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Group Update request.<br>Please wait for the Status to change to Operational.</strong>', 10000, { class: '', id: '' }, true);
       
        if (tags.length > 0) {
          var tag = new Tags({'Tags': tags, objectId: response.object_id });
          var operation = '$update';
          if ($scope.freshTag) {
            operation = '$create';
          }
          tag[operation](function(response){
            console.log("response of tags update", response)
          });
        }


      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!");
      });
    };

    // Find a list of Storagegroups
    $scope.find = function () {
      //$scope.storagegroups = Storagegroups.query();
      //$scope.servers = Servers.query();
      // $scope.sspDailyRetention = defaultDailyRetention;
      // $scope.sspDailySchedule = defaultDailySchedule;

    };

    // Find existing Storagegroup
    $scope.findOne = function () {
      Storagegroups.get({
        storagegroupId: $stateParams.storagegroupId
      }, function(data) {
        $scope.storagegroup = data;
        if(data.snapshot_policy.enabled){
          $scope.hourly_schedule = data.snapshot_policy.hourly_schedule;
          $scope.daily_schedule = data.snapshot_policy.daily_schedule;
          $scope.monthly_schedule = data.snapshot_policy.monthly_schedule;
          $scope.weekly_schedule = data.snapshot_policy.weekly_schedule;
          $scope.hourlyScheduleEnabled = data.snapshot_policy.hourly_schedule.snapshots_to_keep > 0 ? true : false;
          $scope.dailyScheduleEnabled = data.snapshot_policy.daily_schedule.snapshots_to_keep > 0 ? true : false;
          $scope.weeklyScheduleEnabled = data.snapshot_policy.weekly_schedule.snapshots_to_keep > 0 ? true : false;
          $scope.monthlyScheduleEnabled = data.snapshot_policy.monthly_schedule.snapshots_to_keep > 0 ? true : false;
          //parseSnapShotPolicy(data.snapshot_policy);
          prepareDetailedSnapShotPolicy();
          
        }

        //Get tags information
        Tags.get({
          objectId: $stateParams.storagegroupId
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

      }, function(error){
        $location.path('storagegroups');
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!");
      });

      $http.get('api/lookups/sgStatus')
        .then(function(response) {
          $scope.validStatusToAssign = response.data;
      });     
    };

    //Fix to be applied by root (managed services)
    $scope.fix = function () {
      var storagegroup = $scope.storagegroup;
      storagegroup.fromFix = "true";
      storagegroup.$update(function () {
        $location.path('storagegroups');
        Flash.create('success', '<strong ng-non-bindable>Successfully fixed the Storagegroup!</strong>', 10000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || "Something Went wrong!");
      });
    };


   // $scope.validPerformanceSLToAssign = [{id:'standard',name:'Standard'}, {id:'premium',name:'Premium'}, {id:'performance',name:'Performance'}];
    //$scope.tier = 'standard';
    $scope.sspDailySchedules = [{val:'1810',displayVal:'18:10'},
                                {val:'2010',displayVal:'20:10'},
                                {val:'2210',displayVal:'22:10'},
                                {val:'0010',displayVal:'00:10'},
                                {val:'0210',displayVal:'02:10'},
                                {val:'0410',displayVal:'04:10'},
                                {val:'0610',displayVal:'06:10'}];
    $scope.sspHourlyRetentions = [0,12,24];
    $scope.sspDailyRetentions = [7,14,30];
    $scope.sspWeeklyRetentions = [0,5];
    $scope.sspMonthlyRetentions = [0,1];
  }
]);
