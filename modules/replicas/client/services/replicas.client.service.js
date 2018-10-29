'use strict';

//replicas service used for communicating with the replicas REST endpoints
angular.module('replicas').factory('Replicas', ['$resource',
  function ($resource) {
    return $resource('api/replicas/:replicaId', {
      replicaId: '@replicaId'
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
