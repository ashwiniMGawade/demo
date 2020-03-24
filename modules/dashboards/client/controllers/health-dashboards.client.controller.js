'use strict';

angular.module('dashboards').controller('DashboardsHealthController', ['$scope', '$stateParams', '$filter', '$http', '$interval', 'Authentication', 'Health', 'Flash',
  function ($scope, $stateParams, $filter, $http, $interval, Authentication, Health, Flash) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isPartner = Authentication.user.roles.indexOf('partner') !== -1;
    $scope.from = "d";
    $scope.scope = "tenant";
    $scope.custom = {};

    
    console.log($stateParams)
    $scope.type = $stateParams.type
    console.log($scope.type);
    $scope.data = []

    var results = Health.query({"type":$scope.type});
    $scope.isLoading = true;
    results.$promise.then(function(results) {
        $scope.data = results
        $scope.isLoading = false;
    });
    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + message + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    $scope.orderBy = ""
    $scope.search = ""

    $scope.orderByFn = function(col) {
        if ($scope.orderBy == "" ){
           $scope.orderBy = col
        } else if($scope.orderBy == col) {
            $scope.orderBy = "-" + col
        } else {
            $scope.orderBy = col
        }      
    }

    $scope.getSortingClass = function(col) {
        if($scope.orderBy == col) {
            return "luci-table__header-cell-sort--sorting-ascending"
         } else if($scope.orderBy == "-"+ col) {
            return "luci-table__header-cell-sort--sorting-descending"
         }      
    }


  }]);
