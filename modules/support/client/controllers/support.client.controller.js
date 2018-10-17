'use strict';

angular.module('support').controller('SupportController', ['$scope', 'Authentication', '$stateParams', '$http', '$location',
  function ($scope, Authentication, $stateParams, $http, $location) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.software = $stateParams.software;

    $scope.downloadsoftware = $location.protocol() + '://'+ $location.host() +':'+  $location.port()+'/api/support/downloads?software='+$stateParams.software;

    $http.get('/api/support/softwarekey?software='+$scope.software)
      .then(function(response) {
        if(response.status == 200) {
          $scope.softwareKey = response.data;
        } 
      });
  }
]);
