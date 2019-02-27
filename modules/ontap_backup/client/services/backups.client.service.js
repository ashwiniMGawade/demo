'use strict';

//backups service used for communicating with the backups REST endpoints
angular.module('backups').factory('Backups', ['$resource', '$window',
  function ($resource, $window) {
    var header = $window.localStorage.getItem('header');
    var authHeader = header ? { 'Authorization': 'Basic '+  header} : {};
    return $resource(goAPIHost +'/backups/:backupId', {
      backupId: '@backupId'
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
        url: goAPIHost + '/backups/:backupId'
      },
      'query': {
        method: 'GET',
        isArray: true,
        headers: authHeader,
        url:goAPIHost + '/backups'
      },
      'remove': {
        method: 'DELETE',
        headers: authHeader,
        url: goAPIHost + '/backups/:backupId'
      },
    });
  }
]);
