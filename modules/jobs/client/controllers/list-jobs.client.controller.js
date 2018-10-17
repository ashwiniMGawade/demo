'use strict';

angular.module('jobs').controller('JobListController', ['$scope', '$interval', '$filter', 'Jobs', 'Authentication', 'NgTableParams', 'modalService', 'Flash', '$sanitize',
  function ($scope, $interval, $filter, Jobs, Authentication, NgTableParams, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;

    var reloadCnt = 0;

    //datetimepicker functions

    $scope.startDateisOpen = false;
    $scope.endDateisOpen = false;

    $scope.openStartDateCalendar = function(e) {
        e.preventDefault();
        e.stopPropagation();
        $scope.endDateisOpen = false;
        $scope.startDateisOpen = true;
    };

    $scope.openEndDateCalendar = function(e) {
        e.preventDefault();
        e.stopPropagation();
        $scope.startDateisOpen = false;
        $scope.endDateisOpen = true;
    };

    //Refresh the contents of the page after every 30 seconds
    var refreshData = $interval(function() {  reloadCnt++; $scope.tableParams.reload(); }, featuresSettings.pageRefresh);
    $scope.$on('$destroy', function(){
      $interval.cancel(refreshData);
    });

    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    $scope.checkValidDate = function (startDate, endDate) {
      $scope.startDateErrMessage= '';
      $scope.endDateErrMessage= '';

      if (startDate > endDate && $scope.endDate) {
        $scope.endDateErrMessage = 'EndDate should be greater than startDate';
        return false;
      }
      return true;
    };


    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,
        sorting: { created: 'desc' }
      }, {
        counts: [],
        getData: function($defer, params) {          
          var queryParams = {};

          if (reloadCnt >= 1){
            queryParams.ispolling = 1;
          }

          if ($scope.startDate && $scope.endDate) {
            var startDate = $filter('date')($scope.startDate, "yyyyMMddTHHmmss");
            var endDate = $filter('date')($scope.endDate, "yyyyMMddTHHmmss");
            if (startDate) {
              queryParams.start = startDate;
            }
            if (endDate) {
              queryParams.end = endDate;
            }
          }
          if ($scope.search) {
            queryParams.search = $sanitize($scope.search);
          }
          Jobs.query(queryParams, function (data) {
            $scope.jobs = data;

            var filteredData = $filter('filter')($scope.jobs, function(data) {
              if ($scope.search) {
                return true;
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
