'use strict';

angular.module('core').factory('authInterceptor', ['$q', '$injector','$window',
  function ($q, $injector, $window) {    
    return {
      responseError: function(rejection) {
        if (!rejection.config.ignoreAuthModule) {
          switch (rejection.status) {
            case 401:
              var state =  $injector.get('$state');
              console.log(state);
              state.go('authentication.signin');
              if ( angular.element(document).find("flash-message").find('strong').length === 0) {
                  $injector.get('Flash').create('warning', '<strong ng-non-bindable>Session has expired! Please login.</strong>', 3000, {
                    class: '',
                    id: 'session-error'
                  }, true);
              }
                            
              break;
            case 403:
              $injector.get('$state').go('forbidden');
              if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
                $injector.get('Flash').create('danger', '<strong ng-non-bindable>Not Authorized to access the resource</strong>', 3000, {
                      class: '',
                      id: ''
                    }, true);
              }
              break;
          }
        }
        // otherwise, default behaviour
        return $q.reject(rejection);
      }
    };
  }
]);
