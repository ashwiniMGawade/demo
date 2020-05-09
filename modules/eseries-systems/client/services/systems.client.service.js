'use strict';

//systems service used for communicating with the systems REST endpoints
angular.module('systems').factory('Systems', ['$resource',
  function ($resource) {
    return $resource('api/systems/:systemId', {
      systemId: '@systemId'
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
