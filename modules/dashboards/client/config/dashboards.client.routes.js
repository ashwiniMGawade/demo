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
      });
  }
]);
