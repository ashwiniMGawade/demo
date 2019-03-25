'use strict';

//Storagegroups service used for communicating with the storagegroups REST endpoints
angular.module('storagegroups').factory('Storagegroups', ['$resource', '$window',
  function ($resource, $window) {
    var header = $window.localStorage.getItem('header');
    var authHeader = header ? { 'Authorization': 'Basic '+  header} : {};
    return $resource(goAPIHost + '/volumes/:storagegroupId', {
      storagegroupId: '@storagegroupId'
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
        isArray: false,
        headers: authHeader,
        url: goAPIHost + '/volumes/:storagegroupId'
      },
      'remove': {
        method: 'DELETE',
        headers: authHeader,
        url: goAPIHost + '/volumes/:storagegroupId'
      },
      'query': {
        method: 'GET',
        isArray: true,
        headers: authHeader,
        url:goAPIHost + '/volumes'
      }
      
    });
  }
]);

angular.module('storagegroups').factory('Snapshots', ['$resource', '$window',
  function ($resource, $window) {
    var header = $window.localStorage.getItem('header');
    var authHeader = header ? { 'Authorization': 'Basic '+  header} : {};
    return $resource(goAPIHost + '/volumes/:storagegroupId/snapshots/:snapshotId', {
      storagegroupId: '@storagegroupId',
      snapshotId : '@snapshotId'
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
        url: goAPIHost + '/volumes/:storagegroupId/snapshots/:snapshotId'
      },
      'remove': {
        method: 'DELETE',
        headers: authHeader,
        url: goAPIHost + '/volumes/:storagegroupId/snapshots/:snapshotId'
      },
      'query': {
        method: 'GET',
        isArray: true,
        headers: authHeader,
        url:goAPIHost + '/volumes/:storagegroupId/snapshots'
      }
    });
  }
]);
