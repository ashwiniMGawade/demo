'use strict';

//Tenants service used for communicating with the tenants REST endpoints
angular.module('tenants').factory('Tenants', ['$resource',
  function ($resource) {
    return $resource('api/tenants/:tenantId', {
      tenantId: '@tenantId'
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
