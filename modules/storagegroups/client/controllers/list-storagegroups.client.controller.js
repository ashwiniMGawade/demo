'use strict';

angular.module('storagegroups').controller('StoragegroupListController', ['$scope', '$filter', '$interval', 'Storagegroups', 'NgTableParams', 'Authentication',
  function ($scope, $filter, $interval, Storagegroups, NgTableParams, Authentication) {

    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.isUser = Authentication.user.roles.indexOf('user') !== -1;
    $scope.labels = featuresSettings.labels;
    $scope.SGAccessRoles = featuresSettings.roles.storagegroup;

    //Refresh the contents of the page after every 30 seconds
    var refreshData = $interval(function() { 
      $scope.tableParams.reload();
    }, featuresSettings.pageRefresh);

    $scope.refreshList = function() {
      $scope.tableParams.reload();
    }
    
    $scope.$on('$destroy', function(){
      $interval.cancel(refreshData);
    });

    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          var pollingParams={};
          if ((/^(([a-zA-Z\-0-9\._]+=[a-zA-Z\-0-9\._]+)*(?:;(([a-zA-Z\-0-9\._]+=[a-zA-Z\-0-9\._]+))+)*)*$/).test($scope.search)){
            var searchedTags = $scope.search.split(";");
            angular.forEach(searchedTags, function(tag) {
              var tagData = tag.split("=");
              pollingParams[tagData[0]] = tagData[1];
            })
          }
          Storagegroups.query(pollingParams, function (data) {
            $scope.storagegroups = data;

            var filteredData = $filter('filter')($scope.storagegroups, function(data) {
              if ($scope.search && !(/^(([a-zA-Z\-0-9\._]+=[a-zA-Z\-0-9\._]+)*(?:;(([a-zA-Z\-0-9\._]+=[a-zA-Z\-0-9\._]+))+)*)*$/).test($scope.search)) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.code) ? data.code.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.server) ? data.server.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.subtenant) ? data.subtenant.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.tenant && $scope.isRoot) ? data.tenant.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.snapshotPolicy) ? data.snapshotPolicy.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.status) ? data.status.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ;
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
