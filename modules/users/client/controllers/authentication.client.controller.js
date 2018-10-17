'use strict';

angular.module('users')
  .controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator', 'Flash', '$timeout', '$sanitize',
  function ($scope, $state, $http, $location, $window, Authentication, PasswordValidator, Flash, $timeout, $sanitize) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();
   
    // Get an eventual error defined in the URL query string:
    $timeout(function() {
      if ($location.search().err && angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize($location.search().err) + '</strong>', 3000, { class: '', id: '' }, true);
      }
    }, 800);

   
    // If user is signed in then redirect back home
    if ($scope.authentication.user) {  
      console.log($scope.authentication.user.roles)
      if ($scope.authentication.user.roles.indexOf('root') === -1 && $scope.authentication.user.roles.indexOf('l1ops') === -1) {
        $location.path('/dashboards');
      } else {
        $location.path('/');
      }  
      
    }

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;
        
        // And redirect to the previous or home page if not root or partner user
        if($state.previous.state.name === 'home' && response.roles.indexOf('root') === -1 && response.roles.indexOf('l1ops') === -1 && response.roles.indexOf('partner') === -1) {
          console.log("going to dashboard");
          $state.go('dashboard', $state.previous.params);
        } else {
          console.log($state.previous.state.name);
          $state.go($state.previous.state.name || 'home', $state.previous.params);
          console.log("going to home");
        }
        
        
      }).error(function (response) {
        if (response.message && angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
          Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(response.message) + '</strong>', 3000, { class: '', id: '' }, true);
        }
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);
