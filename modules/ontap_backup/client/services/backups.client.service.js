'use strict';

//backups service used for communicating with the backups REST endpoints
angular.module('backups').factory('Backups', ['$resource',
  function ($resource) {
    return $resource(goAPIHost +'/backups/:backupId', {
      backupId: '@backupId'
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
