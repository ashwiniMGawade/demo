'use strict';

angular.module('icrs').controller('IcrListController', ['$scope', '$filter', 'Icrs', 'Authentication', 'NgTableParams',
  function ($scope, $filter, Icrs, Authentication, NgTableParams) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.labels = featuresSettings.labels;    
    $scope.icrAccessRoles = featuresSettings.roles.icr;
    
    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { created: 'desc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Icrs.query(function (data) {
            $scope.icrs = data;

            var filteredData = $filter('filter')($scope.icrs, function(data) {
              if ($scope.search) {
                return ((data.message) ? data.message.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.server.name) ? data.server.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.tenant.name && $scope.isRoot) ? data.tenant.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.clusterExt) ? data.clusterExt.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.ipsExt) ? data.ipsExt.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.status) ? data.status.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
