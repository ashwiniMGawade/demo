'use strict';

//notifications Notifications service used for communicating with the notifications REST endpoints
angular.module('notifications').factory('Notifications', ['$resource',
  function ($resource) {
    return $resource('api/notifications/:notificationId', {
      notificationId: '@notificationId'
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
