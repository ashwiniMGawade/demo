'use strict';

// Reports controller
angular.module('reports')
  .controller('ReportsController', ['$scope', '$stateParams', '$http', 'Authentication', 'Tenants', 'Reports', 'PER_PAGE', 'Flash', '$sanitize',
  function ($scope, $stateParams, $http, Authentication, Tenants, Reports, PER_PAGE, Flash, $sanitize) {
    $scope.authentication = Authentication;
    Tenants.query().$promise.then(function(data){
      $scope.tenants = data;
      $scope.tenants.push({'tenantId': 'all', 'name': 'All Tenants'});
    });
    //add extra field for All Tenant
    $scope.tenant = { 'id' : '' };
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isPartner = Authentication.user.roles.indexOf('partner') !== -1;
    $scope.isL1ops = Authentication.user.roles.indexOf('l1ops') !== -1;

    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

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

    $scope.download = function(filename) {
      $http({ method: 'GET', url: 'api/reports/'+ filename }).
      success(function(data, status, headers, config) {
        if (status === 200) {
          var anchor = angular.element('<a/>');
          angular.element(document.body).append(anchor);         
          var tagToClick = anchor.attr({
            href: 'api/reports/'+ filename,
            target: '_blank',
            download: filename
          })[0];

        // First create an event as per DOM level 3 documents
        var click_ev = document.createEvent("MouseEvents");
        // initialize the event
        click_ev.initEvent("click", true /* bubble */, true /* cancelable */);
        tagToClick.dispatchEvent(click_ev);
        }
      }).
      error(function(data, status, headers, config) {
        throwFlashErrorMessage(data.message); 
      });
    };

    var getDateFormat = function (date) {
      var DateObject = new Date(date);
      if (DateObject) {
        return DateObject.getFullYear().toString() + ('0' + (DateObject.getMonth() + 1)).slice(-2).toString() + ('0' + DateObject.getDate()).slice(-2).toString();
      }
      return false;
    };

    $scope.checkValidDate = function (startDate, endDate) {
      var curDate = new Date();
      $scope.startDateErrMessage= '';
      $scope.endDateErrMessage= '';

      if (startDate > curDate && $scope.startDate) {
        $scope.startDateErrMessage = 'StartDate should not be grater than today.';
        return false;
      }
      if (startDate > endDate && $scope.endDate) {
        $scope.endDateErrMessage = 'EndDate should be greater than startDate';
        return false;
      }
      return true;
    };

    $scope.search = function (isValid) {
      $scope.error = null;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'reportListForm');
        return false;
      }
      var queryParams = {};
      if (typeof(Authentication.user.tenant) !== 'undefined' && !$scope.isRoot && !$scope.isL1ops) {
        queryParams.tenant = Authentication.user.tenant;
      } else if ($scope.tenant.id !== '') {
        queryParams.tenant = $scope.tenant.id;
      } else {
        $scope.reports = false;
        return false;
      }

      if ($scope.startDate && $scope.endDate) {
        var startDate = getDateFormat($scope.startDate);
        var endDate = getDateFormat($scope.endDate);
        if (startDate) {
          queryParams.start = startDate;
        }
        if (endDate) {
          queryParams.end = endDate;
        }
      }

      Reports.query(queryParams, function (data) {
        $scope.reports = data;
        $scope.buildPager();
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = PER_PAGE;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $scope.reports;
      $scope.filterLength = $scope.reports.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);

    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };

    function getDayClass(data) {
      var date = data.date,
        mode = data.mode;
      if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0,0,0,0);

        for (var i = 0; i < $scope.events.length; i++) {
          var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

          if (dayToCheck === currentDay) {
            return $scope.events[i].status;
          }
        }
      }
      return '';
    }
  }
]);
