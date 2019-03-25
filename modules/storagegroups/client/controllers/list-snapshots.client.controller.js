'use strict';

angular.module('storagegroups').controller('SnapshotsListController', ['$scope', '$filter', '$interval', '$location', 'Storagegroups', 'Snapshots', 'NgTableParams', 'Flash', 'Authentication', 'modalService', '$sanitize',
  function ($scope, $filter, $interval, $location, Storagegroups, Snapshots, NgTableParams, Flash, Authentication, modalService, $sanitize) {

    $scope.authentication = Authentication;
    $scope.storagegroupId = location.pathname.split('\/')[2];
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.isUser = Authentication.user.roles.indexOf('user') !== -1;
    $scope.loading = true;
    $scope.snapshotAccessRoles = featuresSettings.roles.snapshot;

    Storagegroups
      .get({
        storagegroupId: $scope.storagegroupId
      }, function(data) {
        $scope.storagegroup = data;
      });

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

    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { code: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Snapshots.query({storagegroupId : $scope.storagegroupId}, function (data) {
            $scope.snapshots = data;

            var filteredData = $filter('filter')($scope.snapshots, function(data) {
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
              } else {
                return true;
              }
            });
            var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
            params.total(orderedData.length);
            $scope.zeroRecords = false;
            if (orderedData.length === 0) {
              $scope.zeroRecords = true;
            }
            $scope.loading = false;
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          }, function(error){
            $location.path('/storagegroups/' + $scope.storagegroupId + '/snapshots');
            $scope.zeroRecords = true;
            $scope.loading = false;
          });
        }
      });
    };
    // Delete SnapShots
    $scope.deleteSnapshot = function (snapshotName) {
      $scope.error = null;
      var snapshots = new Snapshots({
        storagegroupId : $scope.storagegroupId,
        snapshotId : snapshotName
      });

      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Snapshot?',
        bodyText: [ 'Are you sure you want to delete the snapshot '+ snapshotName +' ?' ]
      };

      // Redirect after save
      modalService.showModal({}, modalOptions).then(function (result) {
        snapshots.$remove(function (response) {
          Flash.create('success', '<strong ng-non-bindable>Snapshot Delete request accepted. Please wait and list the Snapshots in a 10 seconds or so</strong>', 10000, { class: '', id: '' }, true);
        }, function (errorResponse) {
          throwFlashErrorMessage(errorResponse.data.message);
        });
      });
    };
  }
]);
