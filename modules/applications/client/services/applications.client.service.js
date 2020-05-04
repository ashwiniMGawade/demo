'use strict';

//Applications service used for communicating with the applications REST endpoints
angular.module('applications').factory('Applications', ['$resource',
  function ($resource) {
    return $resource('api/applications/:applicationId', {
      applicationId: '@applicationId'
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
