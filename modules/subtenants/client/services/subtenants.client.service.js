'use strict';

//Subtenants service used for communicating with the subtenants REST endpoints
angular.module('subtenants').factory('Subtenants', ['$resource',
  function ($resource) {
    return $resource('api/subtenants/:subtenantId', {
      subtenantId: '@subtenantId'
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
