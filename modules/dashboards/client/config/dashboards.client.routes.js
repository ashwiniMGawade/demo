'use strict';

// Setting up route
angular.module('dashboards').config(['$stateProvider',
  function ($stateProvider) {
    // Dashboards state routing
    $stateProvider
      .state('dashboards', {
        abstract: true,
        url: '/dashboards',
        template: '<ui-view/>'
      })
      .state('dashboards.list', {
        url: '',
        templateUrl: 'modules/dashboards/client/views/list-dashboards.client.view.html',
        controller: 'DashboardsListController',
        data: {
          roles: ['read', 'user', 'admin', 'partner', 'root', 'l1ops']
        }
      })
      .state('dashboards.details', {
        url: '/health/:type',
        templateUrl: 'modules/dashboards/client/views/health-dashboards.client.view.html',
        controller: 'DashboardsHealthController',
        data: {
          roles: ['read', 'user', 'admin', 'partner', 'root', 'l1ops']
        }
      })
      // .state('dashboards.nodes', {
      //   url: '/health/nodes',
      //   templateUrl: 'modules/dashboards/client/views/health-dashboards.client.view.html',
      //   controller: 'DashboardsHealthController',
      //   data: {
      //     roles: ['read', 'user', 'admin', 'partner', 'root', 'l1ops']
      //   }
      // })
      // .state('dashboards.aggregates', {
      //   url: '/health/aggregates',
      //   templateUrl: 'modules/dashboards/client/views/health-dashboards.client.view.html',
      //   controller: 'DashboardsHealthController',
      //   data: {
      //     roles: ['read', 'user', 'admin', 'partner', 'root', 'l1ops']
      //   }
      // })
      // .state('dashboards.svms', {
      //   url: '/health/svms',
      //   templateUrl: 'modules/dashboards/client/views/health-dashboards.client.view.html',
      //   controller: 'DashboardsHealthController',
      //   data: {
      //     roles: ['read', 'user', 'admin', 'partner', 'root', 'l1ops']
      //   }
      // })
      // .state('dashboards.volumes', {
      //   url: '/health/volumes',
      //   templateUrl: 'modules/dashboards/client/views/health-dashboards.client.view.html',
      //   controller: 'DashboardsHealthController',
      //   data: {
      //     roles: ['read', 'user', 'admin', 'partner', 'root', 'l1ops']
      //   }
      // });
      ;

  }
]);
