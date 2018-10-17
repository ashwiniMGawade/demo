'use strict';

// Jobs controller
angular.module('jobs').controller('JobsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Jobs', 'modalService', 'Flash', '$sanitize',
  function ($scope, $stateParams, $location, $http, Authentication, Jobs, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;

    var flashTimeout = 3000;
    var dayInclusive = 86399000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    $scope.getResult = function(result) {
      return result ? JSON.parse(result) : {};
    };

    // Remove existing Job
    $scope.remove = function (job) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Job?',
        bodyText: ['Are you sure you want to delete this Job?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (job) {
          job.$remove(function (response) {
            $location.path('jobs');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the job!</strong>', flashTimeout, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });

          for (var i in $scope.jobs) {
            if ($scope.jobs[i] === job) {
              $scope.jobs.splice(i, 1);
            }
          }
        }
      });
    };


    // Find a list of Jobs
    $scope.find = function () {
      $scope.jobs = Jobs.query();
    };

    // Find existing Job
    $scope.findOne = function () {
      Jobs.get({
        jobId: $stateParams.jobId
      }, function(data) {
          $scope.job = data;
          $scope.startDate =  new Date(data.start);
          $scope.endDate = new Date(data.end);
          $scope.startTime = new Date($scope.startDate.getTime() + $scope.startDate.getTimezoneOffset()*60000);
          $scope.endTime = new Date($scope.endDate.getTime() + $scope.endDate.getTimezoneOffset()*60000);
          $scope.selectedTenants = [];
          angular.forEach(data.tenants, function(value, key) {
            $scope.selectedTenants.push(value._id);
          });
      }, function(error){
        $location.path('jobs');
        throwFlashErrorMessage(error.data.message);
      });
    };
  }
]);
