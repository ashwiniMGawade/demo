'use strict';

angular.module('tenants').controller('TenantListController', ['$scope', '$filter', 'Tenants', 'Authentication', 'NgTableParams',
  function ($scope, $filter, Tenants, Authentication, NgTableParams) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.tenantSettings = featuresSettings.tenant;
    $scope.tenantAccessRoles = featuresSettings.roles.tenant;

    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,                // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Tenants.query(function (data) {
            $scope.tenants = data;

            var filteredData = $filter('filter')($scope.tenants, function(data) {
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.code) ? data.code.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.partner && data.partner.name) ? data.partner.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.annotation && $scope.tenantSettings.annotation.enabled) ? data.annotation.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
