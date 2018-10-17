'use strict';

// Setting up route
angular.module('notifications').config(['$stateProvider',
  function ($stateProvider) {
    // notifications state routing
    $stateProvider
      .state('notifications', {
        abstract: true,
        url: '/notifications',
        template: '<ui-view/>'
      })
      .state('notifications.list', {
        url: '',
        templateUrl: 'modules/notifications/client/views/list-notifications.client.view.html',
        controller: 'NotificationListController',
        data: {
          roles: featuresSettings.roles.notification.list,
          parent: 'administration',
          parentstate: 'notifications'
        }
      })
      .state('notifications.create', {
        url: '/create',
        templateUrl: 'modules/notifications/client/views/create-notification.client.view.html',
        data: {
          roles: featuresSettings.roles.notification.create,
          parent: 'administration',
          parentstate: 'notifications'
        }
      })
      .state('notifications.view', {
        url: '/:notificationId',
        templateUrl: 'modules/notifications/client/views/view-notification.client.view.html',
        data: {
          roles: featuresSettings.roles.notification.read,
          parent: 'administration',
          parentstate: 'notifications'
        }
      })      
      .state('notifications.edit', {
        url: '/:notificationId/edit',
        templateUrl: 'modules/notifications/client/views/edit-notification.client.view.html',
        data: {
          roles: featuresSettings.roles.notification.update,
          parent: 'administration',
          parentstate: 'notifications'
        }
      });
  }
]);
