'use strict';

// Notifications controller
angular.module('notifications')
.config(function (uiDatetimePickerConfig) {
    uiDatetimePickerConfig.buttonBar.now.show = false;
    uiDatetimePickerConfig.buttonBar.today.show = false;
})
.controller('NotificationsController', ['$scope', '$stateParams', '$interval', '$location', '$http', '$filter', 'Authentication', 'Tenants', 'Notifications', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $interval, $location, $http, $filter, Authentication, Tenants, Notifications, modalService, Flash, $sanitize) {

    $scope.authentication = Authentication;
    $scope.isRoot = (Authentication.user.roles.indexOf('root') !== -1);
    $scope.isL1ops = (Authentication.user.roles.indexOf('l1ops') !== -1);
    $scope.message = $scope.currentUTCTime;

    $scope.notificationAccessRoles = featuresSettings.roles.notification;    
    $interval(function() {
        var x = $scope.currentUTCTime = (new Date()).toISOString().replace(/z|t/gi,' ');
        x = x.substring(0,x.lastIndexOf(':')+3);
        $scope.currentUTCTime = x;
    }, 1000);

    $http.get('/api/lookups/notificationCategory')
      .then(function(response) {
        $scope.validCategoryToAssign = response.data;
      });

    $scope.tenants = Tenants.query();

    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    //common datepicker functions
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

    function getCurrentUTCDate() {
      var now = new Date();
      return new Date(now.getTime() + now.getTimezoneOffset()*60000);
    }

    $scope.checkValidDate = function (startDate, endDate) {
      var curDate = getCurrentUTCDate();
      $scope.startDateErrMessage = '';
      $scope.endDateErrMessage = '';

      if (!startDate || !endDate) {
        $scope.startDateErrMessage = !startDate ? 'Start date required.' : '';
        $scope.endDateErrMessage =  !endDate ? 'End date required.' : '';
      }
      if (new Date(startDate.getTime() +  startDate.getTimezoneOffset()*60000) < curDate && $scope.startDate && !$scope.notification) {
        $scope.startDateErrMessage += 'StartDate should not be lesser than today.';
      }
      if (startDate > endDate && $scope.endDate) {
        $scope.endDateErrMessage += 'EndDate should be greater than startDate';
      }
      if ($scope.startDateErrMessage || $scope.endDateErrMessage) {
        return false;
      }
      return true;
    };

    var getDateFormat = function (date) {
      var DateObject = new Date(date);
      if (DateObject) {
        return DateObject.getFullYear().toString() + ('0' + (DateObject.getMonth() + 1)).slice(-2).toString() + ('0' + DateObject.getDate()).slice(-2).toString();
      }
      return false;
    };


    // Create new Notification
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid || !$scope.checkValidDate($scope.startDate, $scope.endDate)) {
        $scope.$broadcast('show-errors-check-validity', 'notificationForm');
        return false;
      }

      // Create new Notification object
      var notification = new Notifications({
        summary: $sanitize(this.summary),
        message: $sanitize(this.message),
        category: $sanitize(this.category),
        start: $sanitize(this.startDate),
        end: $sanitize(this.endDate),
        sendEmail: $scope.sendEmail,
        tenantsId: this.tenantsId ? this.tenantsId : ''
      });
      
      //Redirect to the notifications page
      notification.$create(function (response) {
        $location.path('notifications');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the notification message</strong>', flashTimeout, { class: '', id: '' }, true);
        // Clear form fields
        $scope.summary = '';
        $scope.message = '';
        $scope.category = '';
        $scope.startDate = '';
        $scope.endDate = '';
        $scope.sendEmail = false;
        $scope.tenantsId = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Remove existing Notification
    $scope.remove = function (notification) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Notification?',
        bodyText: ['Are you sure you want to delete this Notification?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (notification) {
          notification.$remove(function (response) {
            $location.path('notifications');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the notification!</strong>', flashTimeout, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });

          for (var i in $scope.notifications) {
            if ($scope.notifications[i] === notification) {
              $scope.notifications.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Notification
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid || !$scope.checkValidDate($scope.startDate, $scope.endDate)) {
        $scope.$broadcast('show-errors-check-validity', 'notificationForm');
        return false;
      }

      var notification = $scope.notification;
      notification.start = $sanitize(this.startDate);
      notification.end = $sanitize(this.endDate);

      notification.$update(function () {
        $location.path('notifications');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the Notification!</strong>', flashTimeout, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Find a list of Notifications
    $scope.find = function () {
      $scope.notifications = Notifications.query();
      $scope.tenants = Tenants.query();
    };

    // Find existing Notification
    $scope.findOne = function () {
      Notifications.get({
        notificationId: $stateParams.notificationId
      }, function(data) {
          $scope.notification = data;
          $scope.startDate =  new Date(data.start);
          $scope.endDate = new Date(data.end);
          $scope.selectedTenants = [];
          angular.forEach(data.tenants, function(value, key) {
            $scope.selectedTenants.push(value._id);
          });
      }, function(error){
        $location.path('notifications');
        throwFlashErrorMessage(error.data.message);
      });
    };
  }
]);
