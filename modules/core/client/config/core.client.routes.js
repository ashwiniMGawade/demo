'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing
    $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'modules/core/client/views/home.client.view.html'
    })
    .state('dashboard', {
      url: '/dashboards',
      templateUrl: 'modules/dashboards/client/views/list-dashboards.client.view.html',
      controller: 'DashboardsListController',
      data: {
        roles: ['read', 'user', 'admin', 'partner', 'root']
      }
    })
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('unknown-user', {
      url: '/unknown-user',
      templateUrl: 'modules/core/client/views/unknown-user.html',
      data: {
        ignoreState: true
      }
    })
    .state('terms-and-conditions', {
      url: '/terms-and-conditions',
      templateUrl: 'modules/core/client/views/terms-and-conditions.html',
      data: {
        ignoreState: true
      }
    });

    // Support routes
    // $stateProvider
    // .state('support', {
    //   abstract: true,
    //   url: '/support',
    //   template: '<ui-view/>',
    //   data: {
    //     roles: ['user', 'admin', 'root', 'partner', 'read'],
    //     parent: 'support',
    //     parentstate: 'support.portal'
    //   }
    // })
    // .state('support.portal', {
    //   url: '',
    //   templateUrl: 'modules/core/client/views/support/portal_user_guide.client.view.html',
    // });
  }
]);
