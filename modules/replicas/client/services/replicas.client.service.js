'use strict';

//console.log("In replica service",$scope.authentication.user);

//replicas service used for communicating with the replicas REST endpoints
angular.module('replicas').factory('Replicas', ['$resource', '$window',
  function ($resource, $window) {
    var header = $window.localStorage.getItem('header');
    var authHeader = header ? { 'Authorization': 'Basic '+  header} : {};
    return $resource(goAPIHost +'/replicas/:replicaId', {
      replicaId: '@replicaId'
    }, {
      update: {
        method: 'PUT',
        headers: authHeader
      },
      create: {
        method: 'POST',
        headers: authHeader
      },
      'get': {
        method: 'GET',
        headers: authHeader,
        url: goAPIHost + '/replicas/:replicaId'
      },
      'query': {
        method: 'GET',
        isArray: true,
        headers: authHeader,
        url:goAPIHost + '/replicas'
      },
      'remove': {
        method: 'DELETE',
        headers: authHeader,
        url: goAPIHost + '/replicas/:replicaId'
      },
      
    });
  }
]);
