'use strict';

// Setting up route
angular.module('pods').config(['$stateProvider',
  function ($stateProvider) {
    // Pods state routing
    $stateProvider
      .state('pods', {
        abstract: true,
        url: '/pods',
        template: '<ui-view/>'
      })
      .state('pods.list', {
        url: '',
        templateUrl: 'modules/pods/client/views/list-pods.client.view.html',
        controller: 'PodsListController',
        data: {
          roles: featuresSettings.roles.pod.list,
          parent: 'administration',
          parentstate: 'pods'
        }
      })
      .state('pods.create', {
        url: '/create',
        templateUrl: 'modules/pods/client/views/create-pod.client.view.html',
        data: {
          roles: featuresSettings.roles.pod.create,
          parent: 'administration',
          parentstate: 'pods'
        }
      })
      .state('pods.view', {
        url: '/:podId',
        templateUrl: 'modules/pods/client/views/view-pod.client.view.html',
        data: {
          roles: featuresSettings.roles.pod.read,
          parent: 'administration',
          parentstate: 'pods'
        }
      })
      .state('pods.edit', {
        url: '/:podId/edit',
        templateUrl: 'modules/pods/client/views/edit-pod.client.view.html',
        data: {
          roles: featuresSettings.roles.pod.update,
          parent: 'administration',
          parentstate: 'pods'
        }
      });
  }
]);
