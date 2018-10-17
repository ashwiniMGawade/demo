'use strict';

//Storage Units service used for communicating with the Storage units REST endpoints 

angular.module('storageunits').factory('Storageunits', ['$resource',
  function ($resource) {
    return $resource('api/storageunits/:storageunitId', {
      storageunitId: '@storageunitId'
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
