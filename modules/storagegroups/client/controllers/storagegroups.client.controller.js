'use strict';

// Storagegroups controller
angular.module('storagegroups').controller('StoragegroupsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Storagegroups', 'Snapshots', 'Servers', 'modalService', 'Flash', 'Tenants', '$sanitize',  function ($scope, $stateParams, $location, $http, Authentication, Storagegroups, Snapshots, Servers, modalService, Flash, Tenants, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.isUser = Authentication.user.roles.indexOf('user') !== -1;
    $scope.labels = featuresSettings.labels;
    $scope.SGAccessRoles = featuresSettings.roles.storagegroup;
    $scope.snapshotAccessRoles = featuresSettings.roles.snapshot;
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

    $scope.hourly_schedule = {}
    $scope.daily_schedule = {}
    $scope.weekly_schedule = {}
    $scope.monthly_schedule = {}

    $scope.backup_hourly_schedule = {}
    $scope.backup_daily_schedule = {}
    $scope.backup_weekly_schedule = {}
    $scope.backup_monthly_schedule = {}

    $scope.defaultHourlySchedule = {
      "minute": 0,
      "snapshots_to_keep": 0
    }

    $scope.defaultDailySchedule = {
      "hour": "",
      "minute": 0,
      "snapshots_to_keep": 0
    }

    $scope.defaultWeeklySchedule = {
      "hour": 0,
      "minute": 0,
      "day_of_week":0,
      "snapshots_to_keep": 0
    }

    $scope.defaultMonthlySchedule = {
      "hour": 0,
      "minute": 0,
      "day_of_month":0,
      "snapshots_to_keep": 0
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
          if (server.tenant && server.tenant._id === tenant && server.managed === 'Portal' && server.status === 'Operational') {
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



    $scope.setVarsAsPerDPlevel = function (dp) {
      $scope.showReplicaForm = false;
      $scope.showBackupForm = false;
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
 

    var checkSnapshotPolicyErrors = function(scopeVar) {
      if (scopeVar.ssPolicyEnabled && !(scopeVar.hourlyScheduleEnabled || scopeVar.dailyScheduleEnabled || scopeVar.weeklyScheduleEnabled || scopeVar.monthlyScheduleEnabled)) {
        throwFlashErrorMessage("Please enable at least one schedule with Snapshots to keep > 0");
        return false;
      }

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

    // Create new Storagegroup
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'storagegroupForm');
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
      
      //var formattedSanpShotPolicy = formatSnapShotPolicy();
      // Create new Storagegroup object
      var storagegroup = new Storagegroups({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        annotation: (this.annotation) ? $sanitize(this.annotation) : '',
        server_id: $sanitize(this.serverId),
        tier: $sanitize(this.tier),
        protection_service_level: $sanitize(this.protection_service_level),
        size_bytes:this.size_bytes,
        snapshot_policy: {
          enabled:ssPolicyEnabled ? true: false
        }
      });

      if (this.showReplicaForm) {
        storagegroup.replica_destination_server_id = $sanitize(this.replica_destination_server_id)
        storagegroup.replica_schedule = this.replica_schedule
      }

      if (this.showBackupForm) {
        storagegroup.backup_destination_server_id = $sanitize(this.backup_destination_server_id)
        storagegroup.backup_schedule = this.backup_schedule;
        storagegroup.backup_policy =  {
          enabled:backupPolicyEnabled ? true: false
        }
      }

      if (ssPolicyEnabled) {
        if (this.hourlyScheduleEnabled) {
          storagegroup.snapshot_policy.hourly_schedule = this.hourly_schedule ? this.hourly_schedule : this.defaultHourlySchedule;
        }

        if (this.dailyScheduleEnabled) {
          storagegroup.snapshot_policy.daily_schedule = this.daily_schedule ? this.daily_schedule : this.defaultDailySchedule;
        }
        if (this.weeklyScheduleEnabled) {
          storagegroup.snapshot_policy.weekly_schedule = this.weekly_schedule ? this.weekly_schedule : this.defaultWeeklySchedule;
        }

        if (this.monthlyScheduleEnabled) {
          storagegroup.snapshot_policy.monthly_schedule = this.monthly_schedule ? this.monthly_schedule : this.defaultMonthlySchedule;
        }       
        
      }


      if (backupPolicyEnabled) {
        if (this.hourlyScheduleEnabled) {
          storagegroup.backup_policy.hourly_schedule = this.backup_hourly_schedule ? this.backup_hourly_schedule : this.defaultHourlySchedule;
        }

        if (this.dailyScheduleEnabled) {
          storagegroup.backup_policy.daily_schedule = this.backup_daily_schedule ? this.backup_daily_schedule : this.defaultDailySchedule;
        }
        if (this.weeklyScheduleEnabled) {
          storagegroup.backup_policy.weekly_schedule = this.backup_weekly_schedule ? this.backup_weekly_schedule : this.defaultWeeklySchedule;
        }

        if (this.monthlyScheduleEnabled) {
          storagegroup.backup_policy.monthly_schedule = this.backup_monthly_schedule ? this.backup_monthly_schedule : this.defaultMonthlySchedule;
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
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message || errorResponse.data.error || "Something went wrong!");
      });
    };

    // Create new SnapShots
    $scope.createSnapshot = function (storagegroup) {
      $scope.error = null;
      var storagegroupId = storagegroup.storagegroupId;
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
        $scope.$broadcast('show-errors-check-validity', 'storagegroupForm');
        return false;
      }

      if ($scope.storagegroup.volume_type != 'mirror') {
         var ssResponse = checkSnapshotPolicyErrors(this);

        if (!ssResponse) {
          return false;
        }
      }
     
      
      var storagegroup = $scope.storagegroup;
      storagegroup.storagegroupId = storagegroup.id;
      storagegroup.snapshot_policy = {
          enabled:ssPolicyEnabled ? true: false
      }

      if (ssPolicyEnabled) {
        if (this.hourlyScheduleEnabled) {
          storagegroup.snapshot_policy.hourly_schedule = this.hourly_schedule ? this.hourly_schedule : this.defaultHourlySchedule;
        }

        if (this.dailyScheduleEnabled) {
          storagegroup.snapshot_policy.daily_schedule = this.daily_schedule ? this.daily_schedule : this.defaultDailySchedule;
        }
        if (this.weeklyScheduleEnabled) {
          storagegroup.snapshot_policy.weekly_schedule = this.weekly_schedule ? this.weekly_schedule : this.defaultWeeklySchedule;
        }

        if (this.monthlyScheduleEnabled) {
          storagegroup.snapshot_policy.monthly_schedule = this.monthly_schedule ? this.monthly_schedule : this.defaultMonthlySchedule;
        }       
        
      }


      storagegroup.$update(function () {
        $location.path('storagegroups');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Group Update request.<br>Please wait for the Status to change to Operational.</strong>', 10000, { class: '', id: '' }, true);
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
          $scope.ssPolicyEnabled = true;
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
