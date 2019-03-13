'use strict';

//tags service used for communicating with the tags REST endpoints
angular.module('tags').factory('Tags', ['$resource', '$window',
  function ($resource, $window) {
    var header = $window.localStorage.getItem('header');
    var authHeader = header ? { 'Authorization': 'Basic '+  header} : {};
    return $resource(goAPIHost + '/tags/:objectId', {
      objectId: '@objectId'
    }, {
      update: {
        method: 'PUT',
        headers: authHeader,
        url: goAPIHost + '/tags/:objectId'
      },
      create: {
        method: 'POST',
        headers: authHeader,
        url: goAPIHost + '/tags/:objectId'
      },
      'get': {
        method: 'GET',
        isArray: true,
        headers: authHeader,
        url: goAPIHost + '/tags/:objectId'
      },
      'remove': {
        method: 'DELETE',
        headers: authHeader,
        url: goAPIHost + '/tags/:objectId'
      },
      'query': {
        method: 'GET',
        isArray: true,
        headers: authHeader,
        url:goAPIHost + '/tags'
      }
      
    });
  }
]);
