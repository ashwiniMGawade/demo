'use strict';

angular.module('backups').controller('BackupsListController', ['$scope', '$filter', 'Authentication', 'Backups', 'NgTableParams',
  function ($scope, $filter, Authentication, Backups, NgTableParams) {

    $scope.authentication = Authentication;
    $scope.backupAccessRoles = featuresSettings.roles.backup;
    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Backups.query(function (data) {
            $scope.backups = data;
            var filteredData = $filter('filter')($scope.backups, function(data) {    
              if ($scope.search) {
                return ((data.source_site.name) ? data.source_site.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                        ((data.source_server.name) ? data.source_server.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                        ((data.source_volume.name) ? data.source_volume.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                        ((data.destination_site.name) ? data.destination_site.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                        ((data.destination_server.name) ? data.destination_server.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                        ((data.destination_volume.name) ? data.destination_volume.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                       ((data.status) ? data.status.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.state) ? data.state.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          });
        }
      });
    };     
  }
]);
