'use strict';

angular.module('pods').controller('PodsListController', ['$scope', '$filter', 'Authentication', 'Pods', 'NgTableParams',
  function ($scope, $filter, Authentication, Pods, NgTableParams) {

    $scope.authentication = Authentication;
    $scope.podAccessRoles = featuresSettings.roles.pod;
    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Pods.query(function (data) {
            $scope.pods = data;
            var filteredData = $filter('filter')($scope.pods, function(data) {    
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                       ((data.code) ? data.code.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.site) ? data.site.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
