'use strict';

//Sites service used for communicating with the sites REST endpoints
angular.module('sites').factory('Sites', ['$resource',
  function ($resource) {
    return $resource('api/sites/:siteId', {
      siteId: '@siteId'
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
