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

    $scope.weeksArray = [
      {id : 0, name: "sunday"},
      {id :1, name : "monday"},
      {id :2, name : "tuesday"},
      {id :3, name : "wednesday"}, 
      {id :4, name : "thursday"},
      {id :5, name : "friday"},
      {id :6, name : "saturday"}
    ];

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
          hourly_schedule: this.hourlyScheduleEnabled ? this.hourly_schedule : this.defaultHourlySchedule,
          daily_schedule: this.dailyScheduleEnabled ? this.daily_schedule : this.defaultDailySchedule,
          weekly_schedule: this.weeklyScheduleEnabled ? this.weekly_schedule : this.defaultWeeklySchedule,
          monthly_schedule:this.monthlyScheduleEnabled ? this.monthly_schedule : this.defaultMonthlySchedule
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
      
      var storagegroup = $scope.storagegroup;
      storagegroup.storagegroupId = storagegroup.id;
      storagegroup.snapshot_policy = {
          enabled:ssPolicyEnabled ? true: false,
          hourly_schedule: this.hourlyScheduleEnabled ? this.hourly_schedule : this.defaultHourlySchedule,
          daily_schedule: this.dailyScheduleEnabled ? this.daily_schedule : this.defaultDailySchedule,
          weekly_schedule: this.weeklyScheduleEnabled ? this.weekly_schedule : this.defaultWeeklySchedule,
          monthly_schedule:this.monthlyScheduleEnabled ? this.monthly_schedule : this.defaultMonthlySchedule
        }
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
          $scope.hourlyScheduleEnabled = data.snapshot_policy.hourly_schedule.snapshots_to_keep > 0 ? true : false;
          $scope.dailyScheduleEnabled = data.snapshot_policy.daily_schedule.snapshots_to_keep > 0 ? true : false;
          $scope.weeklyScheduleEnabled = data.snapshot_policy.weekly_schedule.snapshots_to_keep > 0 ? true : false;
          $scope.monthlyScheduleEnabled = data.snapshot_policy.monthly_schedule.snapshots_to_keep > 0 ? true : false;
          //parseSnapShotPolicy(data.snapshot_policy);
          prepareDetailedSnapShotPolicy();
          
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
