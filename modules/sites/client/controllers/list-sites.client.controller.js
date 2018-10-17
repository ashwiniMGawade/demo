'use strict';

angular.module('sites').controller('SitesListController', ['$scope', '$filter', 'Authentication', 'Sites', 'NgTableParams',
  function ($scope, $filter, Authentication, Sites, NgTableParams) {
    $scope.authentication = Authentication;
    $scope.siteAccessRoles = featuresSettings.roles.site;
    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Sites.query(function (data) {
            $scope.sites = data;

            var filteredData = $filter('filter')($scope.sites, function(data) {    
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                       ((data.code) ? data.code.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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
