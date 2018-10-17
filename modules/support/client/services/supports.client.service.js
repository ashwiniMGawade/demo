'use strict';

//support service used for communicating with the support REST endpoints
angular.module('support').factory('Support', ['$resource',
  function ($resource) {
    return $resource('api/support/policy', {
    }, {
      create: {
        method: 'POST'
      }
    });
  }
]);
