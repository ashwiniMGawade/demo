'use strict';

angular.module('subscriptions').controller('SubscriptionsListController', ['$scope', '$filter', 'Subscriptions', 'NgTableParams', 'Authentication',
  function ($scope, $filter, Subscriptions, NgTableParams, Authentication) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;
    $scope.isPartner = Authentication.user.roles.indexOf('partner') !== -1;
    $scope.subscriptionSettings = featuresSettings.subscription;
    $scope.subscriptionAccessRoles = featuresSettings.roles.subscription;
    
    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,                // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Subscriptions.query(function (data) {
            $scope.subscriptions = data;

            var filteredData = $filter('filter')($scope.subscriptions, function(data) {
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.code) ? data.code.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.tenant && ($scope.isRoot || $scope.isPartner)) ? data.tenant.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.partner && data.partner.name) ? data.partner.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.site && $scope.subscriptionSettings.site.enabled) ? data.site.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.description && $scope.subscriptionSettings.description.enabled) ? data.description.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.url && $scope.subscriptionSettings.url.enabled) ? data.url.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
