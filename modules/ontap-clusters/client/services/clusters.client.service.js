'use strict';

//clusters service used for communicating with the clusters REST endpoints
angular.module('clusters').factory('Clusters', ['$resource',
  function ($resource) {
    return $resource('api/clusters/:clusterId', {
      clusterId: '@clusterId'
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
