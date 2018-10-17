'use strict';

//Icrs service used for communicating with the icrs REST endpoints
angular.module('icrs').factory('Icrs', ['$resource',
  function ($resource) {
    return $resource('api/icrs/:icrId', {
      icrId: '@icrId'
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
