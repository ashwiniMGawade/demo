'use strict';

// Sites controller
angular.module('sites').controller('SitesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Sites', 'modalService', 'Flash', '$sanitize', 
  function ($scope, $stateParams, $location, Authentication, Sites, modalService, Flash, $sanitize) {
    $scope.authentication = Authentication;
    var flashTimeout = 3000;
    $scope.siteAccessRoles = featuresSettings.roles.site;
    
    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    // Create new Site
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'siteForm');

        return false;
      }

      // Create new Site object
      var site = new Sites({
        name: $sanitize(this.name),
        code: $sanitize(this.code)
      });

      // Redirect after save
      site.$create(function (response) {
        $location.path('sites');
        Flash.create('success', '<strong ng-non-bindable>Successfully created the site!</strong>', 3000, { class: '', id: '' }, true);

        // Clear form fields
        $scope.name = '';
        $scope.code = '';
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Remove existing Site
    $scope.remove = function (site) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Delete Site?',
        bodyText: ['Are you sure you want to delete this Site?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        if (site) {
          site.$remove(function (response) {
            $location.path('sites');
            Flash.create('success', '<strong ng-non-bindable>Successfully Deleted the site!</strong>', 3000, { class: '', id: '' }, true);
          }, function (errorResponse) {
            throwFlashErrorMessage(errorResponse.data.message);
          });

          for (var i in $scope.sites) {
            if ($scope.sites[i] === site) {
              $scope.sites.splice(i, 1);
            }
          }
        }
      });
    };

    // Update existing Site
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'siteForm');

        return false;
      }

      var site = $scope.site;

      site.$update(function () {
        $location.path('sites');
        Flash.create('success', '<strong ng-non-bindable>Successfully updated the site!</strong>', 3000, { class: '', id: '' }, true);
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    };

    // Find a list of Sites
    $scope.find = function () {
      $scope.sites = Sites.query();
    };

    // Find existing Site
    $scope.findOne = function () {
      Sites.get({
        siteId: $stateParams.siteId
      }, function(data) {
        $scope.site = data;
      }, function(error){
        $location.path('sites');
        throwFlashErrorMessage('No site with that identifier has been found');
      });
    };
  }
]);
