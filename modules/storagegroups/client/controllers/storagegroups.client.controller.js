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
    $http.get('api/lookups/serviceLevels')
      .then(function(response) {
        $scope.validTierToAssign = response.data;
    });

    var flashTimeout = 3000;

    $scope.weeksArray = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

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

    function parseSnapShotPolicy(ssPolicy){
      var ssPArr = ssPolicy.split("-");
      for (var i in ssPArr){
        if(ssPArr[i].includes("hourly")){
          $scope.sspHourlyRetention = ssPArr[i].split("hourly")[0];
        }
        if(ssPArr[i].includes("daily")){
          $scope.sspDailyRetention = ssPArr[i].split("daily")[0];
          $scope.sspDailySchedule = ssPArr[i].split("daily")[1];
        }
        if(ssPArr[i].includes("weekly")){
          $scope.sspWeeklyRetention = ssPArr[i].split("weekly")[0];
        }
        if(ssPArr[i].includes("monthly")){
          $scope.sspMonthlyRetention = ssPArr[i].split("monthly")[0];
        }
      }
    }
    
    function prepareDetailedSnapShotPolicy(){
      $scope.detailedSnapShotDesc = "";
      if($scope.sspHourlyRetention){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Hourly snapshots taken @ 00:05 & Retained for " + $scope.sspHourlyRetention + " Hour(s) \n";
      }
      if($scope.sspDailyRetention && $scope.sspDailySchedule){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Daily snapshots taken @ " + $scope.sspDailySchedule.substr(0,2) + ":" + $scope.sspDailySchedule.substr(2,2) +
        " & Retained for " + $scope.sspDailyRetention + " Day(s) \n";
      }
      if($scope.sspWeeklyRetention){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Weekly snapshots taken @ 00:15 Sunday & Retained for " + $scope.sspWeeklyRetention + " Week(s) \n";
      }
      if($scope.sspMonthlyRetention){
        $scope.detailedSnapShotDesc = $scope.detailedSnapShotDesc + "Monthly snapshots taken @ 00:00 1st day of Month & Retained for " + $scope.sspMonthlyRetention + " Month(s) ";
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

    // Create new Storagegroup
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'storagegroupForm');
        return false;
      }

      //need to remove the line once the modification is done in model
      this.daily_schedule.hour = $sanitize(this.daily_schedule.hour);

      //var formattedSanpShotPolicy = formatSnapShotPolicy();
      // Create new Storagegroup object
      var storagegroup = new Storagegroups({
        name: $sanitize(this.name),
        code: $sanitize(this.code),
        annotation: (this.annotation) ? $sanitize(this.annotation) : '',
        server_id: $sanitize(this.serverId),
        tier: $sanitize(this.tier),
        size_bytes:this.size_bytes,
        snapshot_policy: {
          enabled:ssPolicyEnabled ? true: false,
          hourly_schedule: this.hourly_schedule,
          daily_schedule: this.daily_schedule,
          weekly_schedule: this.weekly_schedule,
          monthly_schedule:this.monthly_schedule
        }
      });

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
        $scope.snapshot_policy = '';
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
        throwFlashErrorMessage(errorResponse.data.user_message);
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
            throwFlashErrorMessage(errorResponse.data.user_message);
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
      var formattedSanpShotPolicy = formatSnapShotPolicy();
      var storagegroup = $scope.storagegroup;
      storagegroup.storagegroupId = storagegroup.id;
      storagegroup.snapshot_policy = {
        enabled:ssPolicyEnabled ? true: false,
        hourly_schedule: this.hourly_schedule,
        daily_schedule: this.daily_schedule,
        weekly_schedule: this.weekly_schedule,
        monthly_schedule:this.monthly_schedule
      };
      storagegroup.$update(function () {
        $location.path('storagegroups');
        Flash.create('success', '<strong ng-non-bindable>Submitted the Storage Group Update request.<br>Please wait for the Status to change to Operational.</strong>', 10000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.user_message);
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
          //parseSnapShotPolicy(data.snapshot_policy);
          //prepareDetailedSnapShotPolicy();
        }
      }, function(error){
        $location.path('storagegroups');
        throwFlashErrorMessage(error.data.user_message);
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
        throwFlashErrorMessage(errorResponse.data.user_message);
      });
    };


   // $scope.validTierToAssign = [{id:'standard',name:'Standard'}, {id:'premium',name:'Premium'}, {id:'performance',name:'Performance'}];
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
