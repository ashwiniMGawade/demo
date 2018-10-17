'use strict';

// Setting up route
angular.module('reports').config(['$stateProvider',
  function ($stateProvider) {
    // reports state routing using state provider
    $stateProvider
      .state('reports', {
        abstract: true,
        url: '/reports',
        template: '<ui-view/>',
        data: {
          roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          parent: 'reports',
          parentstate: 'reports.list'
        }
      })
      .state('reports.list', {
        url: '',
        templateUrl: 'modules/reports/client/views/list-reports.client.view.html',
      });

  }
]);

