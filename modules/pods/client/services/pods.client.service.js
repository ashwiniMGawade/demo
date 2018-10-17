'use strict';

//Pods service used for communicating with the pods REST endpoints
angular.module('pods').factory('Pods', ['$resource',
  function ($resource) {
    return $resource('api/pods/:podId', {
      podId: '@podId'
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
