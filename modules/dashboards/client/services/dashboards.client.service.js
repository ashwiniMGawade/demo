'use strict';

//Sites service used for communicating with the sites REST endpoints
angular.module('dashboards').factory('Dashboards', ['$resource',
  function ($resource) {
    return $resource('api/dashboards/:dashboardId', {
      dashboardId: '@dashboardId'
    }, {
      update: {
        method: 'PUT'
      },
      create: {
        method: 'POST'
      }
    });
  }
]);