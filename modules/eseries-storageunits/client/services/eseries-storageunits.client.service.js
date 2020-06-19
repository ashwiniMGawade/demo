'use strict';

//Storage Units service used for communicating with the Storage units REST endpoints 

angular.module('eseries-storageunits').factory('EseriesStorageunits', ['$resource',
  function ($resource) {
    return $resource('api/eseries-storageunits/:eseriesStorageunitId', {
      storageunitId: '@eseriesStorageunitId'
    }, {
      update: {
        method: 'PUT'
      },
      create: {
        method: 'POST'
      },
      getIgroups: {
        method: 'GET',
        url: 'api/eseries-storageunits/getListOfIgroups',
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
