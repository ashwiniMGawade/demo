'use strict';

//Subscriptions service used for communicating with the subscriptions REST endpoints
angular.module('subscriptions').factory('Subscriptions', ['$resource',
  function ($resource) {
    return $resource('api/subscriptions/:subscriptionId', {
      subscriptionId: '@subscriptionId'
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
