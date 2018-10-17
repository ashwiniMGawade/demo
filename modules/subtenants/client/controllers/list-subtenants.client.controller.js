'use strict';

angular.module('subtenants').controller('SubtenantListController', ['$scope', '$filter', 'Subtenants', 'Authentication', 'NgTableParams',
  function ($scope, $filter, Subtenants, Authentication, NgTableParams) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isPartner = Authentication.user.roles.indexOf('partner') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.subtenantAccessRoles = featuresSettings.roles.subtenant;
    
    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,                // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Subtenants.query(function (data) {
            $scope.subtenants = data;

            var filteredData = $filter('filter')($scope.subtenants, function(data) {
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.code) ? data.code.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.tenant && data.tenant.name && ($scope.isRoot || $scope.isPartner)) ? data.tenant.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
              } else {
                return true;
              }
            });
            var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
            params.total(orderedData.length);
            $scope.zeroRecords = (orderedData.length === 0);
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          });
        }
      });
    };
  }
]);
