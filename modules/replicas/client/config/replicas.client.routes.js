'use strict';

// Setting up route
angular.module('replicas').config(['$stateProvider',
  function ($stateProvider) {
    // replicas state routing
    $stateProvider
      .state('replicas', {
        abstract: true,
        url: '/replicas',
        template: '<ui-view/>'
      })
      .state('replicas.list', {
        url: '',
        templateUrl: 'modules/replicas/client/views/list-replicas.client.view.html',
        controller: 'ReplicasListController',
        data: {
          roles: featuresSettings.roles.replica.list,
          parent: 'dataProtection',
          parentstate: 'replicas'
        }
      })
      .state('replicas.create', {
        url: '/create',
        templateUrl: 'modules/replicas/client/views/create-replica.client.view.html',
        data: {
          roles: featuresSettings.roles.replica.create,
          parent: 'dataProtection',
          parentstate: 'replicas'
        }
      })
      .state('replicas.view', {
        url: '/:replicaId',
        templateUrl: 'modules/replicas/client/views/view-replica.client.view.html',
        data: {
          roles: featuresSettings.roles.replica.read,
          parent: 'dataProtection',
          parentstate: 'replicas'
        }
      })
      .state('replicas.edit', {
        url: '/:replicaId/edit',
        templateUrl: 'modules/replicas/client/views/edit-replica.client.view.html',
        data: {
          roles: featuresSettings.roles.replica.update,
          parent: 'dataProtection',
          parentstate: 'replicas'
        }
      });
  }
]);
