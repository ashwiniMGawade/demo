'use strict';

angular.module('applications').controller('ApplicationListController', ['$scope', '$filter', 'Applications', 'Authentication', 'NgTableParams',
  function ($scope, $filter, Applications, Authentication, NgTableParams) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.applicationSettings = featuresSettings.application;
    $scope.applicationAccessRoles = featuresSettings.roles.application;

    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,                // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Applications.query(function (data) {
            $scope.applications = data;

            var filteredData = $filter('filter')($scope.applications, function(data) {
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.code) ? data.code.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.partner && data.partner.name) ? data.partner.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.annotation && $scope.applicationSettings.annotation.enabled) ? data.annotation.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
