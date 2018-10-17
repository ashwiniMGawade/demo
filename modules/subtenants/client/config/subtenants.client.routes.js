'use strict';

// Setting up route
angular.module('subtenants').config(['$stateProvider',
  function ($stateProvider) {
    // Subtenants state routing
    $stateProvider
      .state('subtenants', {
        abstract: true,
        url: '/subtenants',
        template: '<ui-view/>'
      })
      .state('subtenants.list', {
        url: '',
        templateUrl: 'modules/subtenants/client/views/list-subtenants.client.view.html',
        controller: 'SubtenantListController',
        data: {
          roles: featuresSettings.roles.subtenant.list,
          parent: 'administration',
          parentstate: 'subtenants'
        }
      })
      .state('subtenants.create', {
        url: '/create',
        templateUrl: 'modules/subtenants/client/views/create-subtenant.client.view.html',
        data: {
          roles: featuresSettings.roles.subtenant.create,
          parent: 'administration',
          parentstate: 'subtenants'
        }
      })
      .state('subtenants.view', {
        url: '/:subtenantId',
        templateUrl: 'modules/subtenants/client/views/view-subtenant.client.view.html',
        data: {
          roles: featuresSettings.roles.subtenant.read,
          parent: 'administration',
          parentstate: 'subtenants'
        }
      })
      .state('subtenants.edit', {
        url: '/:subtenantId/edit',
        templateUrl: 'modules/subtenants/client/views/edit-subtenant.client.view.html',
        data: {
          roles: featuresSettings.roles.subtenant.update,
          parent: 'administration',
          parentstate: 'subtenants'
        }
      });
  }
]);
