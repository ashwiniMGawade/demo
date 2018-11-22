'use strict';

//console.log("In replica service",$scope.authentication.user);

//replicas service used for communicating with the replicas REST endpoints
angular.module('replicas').factory('Replicas', ['$resource', '$window',
  function ($resource, $window) {
    var header = $window.localStorage.getItem('header')
    return $resource(goAPIHost +'/replicas/:replicaId', {
      replicaId: '@replicaId'
    }, {
      update: {
        method: 'PUT',
        headers: { 'Authorization': 'Basic '+  header}
      },
      create: {
        method: 'POST',
        headers: { 'Authorization': 'Basic '+  header}
      },
      'get': {
        method: 'GET',
        headers: { 'Authorization': 'Basic '+  header},
        url: goAPIHost + '/replicas/:replicaId'
      },
      'query': {
        method: 'GET',
        isArray: true,
        headers: { 'Authorization': 'Basic '+  header},
        url:goAPIHost + '/replicas'
      }
      
    });
  }
]);
