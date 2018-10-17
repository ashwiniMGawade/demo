'use strict';

angular.module('users.admin').controller('UserListController', ['$scope', '$filter', 'Admin', 'NgTableParams', 'Authentication',
  function ($scope, $filter, Admin, NgTableParams, Authentication) {

    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
    $scope.userAccessRoles = featuresSettings.roles.user;

    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { firstName: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Admin.query(function (data) {
            $scope.users = data;

            var filteredData = $filter('filter')($scope.users, function(data) {
              if ($scope.search) {
                return ((data.firstName) ? data.firstName.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.lastName) ? data.lastName.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.username) ? data.username.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.email) ? data.email.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.roles) ? data.roles.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.tenant) ? data.tenant.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
