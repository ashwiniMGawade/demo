'use strict';

angular.module('clusters').controller('ClustersListController', ['$scope', '$filter', 'Authentication', 'Clusters', 'NgTableParams',
  function ($scope, $filter, Authentication, Clusters, NgTableParams) {

    $scope.authentication = Authentication;
    $scope.clusterAccessRoles = featuresSettings.roles.cluster;
    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,              // count per page
        sorting: { name: 'asc' }  // initial sorting
      }, {
        counts: [],
        getData: function($defer, params) {
          Clusters.query(function (data) {
            $scope.clusters = data;
            var filteredData = $filter('filter')($scope.clusters, function(data) {    
              if ($scope.search) {
                return ((data.name) ? data.name.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 || 
                       ((data.uuid) ? data.uuid.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.management_ip) ? data.management_ip.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.provisioning_state) ? data.provisioning_state.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                       ((data.rest_uri) ? data.rest_uri.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ;
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
