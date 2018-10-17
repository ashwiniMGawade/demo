'use strict';

//Servers service used for communicating with the servers REST endpoints
angular.module('servers').factory('Servers', ['$resource',
  function ($resource) {
    return $resource('api/servers/:serverId', {
      serverId: '@serverId'
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
