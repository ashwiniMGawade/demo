'use strict';

// Setting up route
angular.module('support').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    $stateProvider
      .state('support', {
        abstract: true,
        url: '/support',
        template: '<ui-view/>'
      })
      .state('support.portal-user-guide', {
        url: '/portal-user-guide',
        templateUrl: 'modules/support/client/views/portal-user-guide.client.view.html',
        data: {
          parentstate:'support.portal-user-guide',
          roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        }        
      })
      .state('support.portal-user-api-guide', {
        url: '/portal-user-api-guide',
        templateUrl: 'modules/support/client/views/portal-user-api-guide.client.view.html',
        data: {
          parentstate: 'support.portal-user-api-guide',
          roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        }        
      })
      .state('support.portal-iscsi-host-setup-guide', {
        url: '/portal-iscsi-host-setup-guide',
        templateUrl: 'modules/support/client/views/portal-iscsi-host-setup-guide.client.view.html',
        data: {
          parentstate: 'support.portal-iscsi-host-setup-guide',
          roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        }        
      })
      .state('support.downloads', {
        abstract: true,
        url: '/downloads',
        template: '<ui-view/>',
        data: {
          roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          parent: 'support.downloads',
          parentstate: 'support.downloads'
        }
      })
      .state('support.downloads.software', {
        url: '/:software',
        templateUrl: 'modules/support/client/views/downloads.client.view.html',
      });
}]);