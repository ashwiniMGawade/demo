'use strict';

//replicas service used for communicating with the replicas REST endpoints
angular.module('replicas').factory('Replicas', ['$resource',
  function ($resource) {
    return $resource(goAPIHost +'/replicas/:replicaId', {
      replicaId: '@replicaId'
    }, {
      update: {
        method: 'PUT'
      },
      create: {
        method: 'POST'
      }
      //,
      // 'query': {
      //   method: 'GET',
      //   url:'/api/replicas'
      // },
      // 'get': {
      //   method: 'GET',
      //   url:'/api/replicas/:replicaId'
      // }
    });
  }
]);
