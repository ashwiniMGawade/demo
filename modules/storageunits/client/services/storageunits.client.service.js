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
      },
      getIgroups: {
        method: 'GET',
        url: 'api/storageunits/getListOfIgroups',
        isArray: true
      },
      getPeers: {
        method: 'GET',
        url: 'api/peers',
        isArray: true
      },
      'query': {
        method: 'GET',
        isArray: true
      },
    });
  }
]);
