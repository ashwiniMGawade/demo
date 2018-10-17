'use strict';

//Storagegroups service used for communicating with the storagegroups REST endpoints
angular.module('storagegroups').factory('Storagegroups', ['$resource',
  function ($resource) {
    return $resource('api/storagegroups/:storagegroupId', {
      storagegroupId: '@storagegroupId'
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

angular.module('storagegroups').factory('Snapshots', ['$resource',
  function ($resource) {
    return $resource('api/storagegroups/:storagegroupId/snapshots/:snapshotId', {
      storagegroupId: '@storagegroupId',
      snapshotId : '@snapshotId'
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
