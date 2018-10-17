'use strict';

angular.module('notifications').controller('NotificationListController', ['$scope', '$interval', '$filter', 'Notifications', 'Authentication', 'NgTableParams', 'modalService', 'Flash', '$sanitize',
  function ($scope, $interval, $filter, Notifications, Authentication, NgTableParams, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = (Authentication.user.roles.indexOf('root') !== -1);
    $scope.isL1ops = (Authentication.user.roles.indexOf('l1ops') !== -1);
    $scope.isAdmin = (Authentication.user.roles.indexOf('admin') !== -1);
    $scope.notificationAccessRoles = featuresSettings.roles.notification;

    var reloadCnt = 0 , pollingParams = {} ;

    //Refresh the contents of the page after every 60 seconds
    var refreshData = $interval(function() { reloadCnt++ ;  $scope.tableParams.reload(); }, 60000);
    $scope.$on('$destroy', function(){
      $interval.cancel(refreshData);
    });

    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    $scope.rowsToDisplay = function () {
      $scope.tableParams = new NgTableParams({
        count: 10,
        sorting: { start: 'desc' }
      }, {
        counts: [],
        getData: function($defer, params) {
          if (reloadCnt >= 1){
            pollingParams.ispolling = 1;
          }
          Notifications.query(pollingParams, function (data) {
            $scope.notifications = data;

            var filteredData = $filter('filter')($scope.notifications, function(data) {
              if ($scope.search) {
                return ((data.message) ? data.message.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.summary) ? data.summary.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1 ||
                  ((data.category)? data.category.toString().toLowerCase().indexOf($scope.search.toLowerCase()): '-1') > -1;
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

    $scope.markAsRead = function(notification) {
      if (!($scope.isRoot || $scope.isL1ops)) {
        var modalOptions = {
          closeButtonText: 'Cancel',
          actionButtonText: 'Ok',
          headerText: notification.summary,
          bodyText: [notification.message]
        };

        modalService.showModal({}, modalOptions).then(function (result) {
          if(!notification.acknowledge){
            notification.$update(function () {
              $scope.tableParams.reload();
            }, function (errorResponse) {
              throwFlashErrorMessage(errorResponse.data.message);
            });
          }
        });
      }
    };
  }
]);
