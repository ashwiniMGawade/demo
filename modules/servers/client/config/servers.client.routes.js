'use strict';

// Setting up route
angular.module('servers').config(['$stateProvider',
  function ($stateProvider) {
    // Servers state routing
    $stateProvider
      .state('servers', {
        abstract: true,
        url: '/servers',
        template: '<ui-view/>'
      })
      .state('servers.list', {
        url: '',
        templateUrl: 'modules/servers/client/views/list-servers.client.view.html',
        controller: 'ServerListController',
        data: {
          roles: featuresSettings.roles.server.list,
          parent: 'storagemanagement',
          parentstate: 'servers'
        }
      })
      .state('servers.create', {
        url: '/create',
        templateUrl: 'modules/servers/client/views/create-server.client.view.html',
        data: {
          roles: featuresSettings.roles.server.create,
          parent: 'storagemanagement',
          parentstate: 'servers'
        }
      })
      .state('servers.view', {
        url: '/:serverId',
        templateUrl: 'modules/servers/client/views/view-server.client.view.html',
        data: {
          roles: featuresSettings.roles.server.read,
          parent: 'storagemanagement',
          parentstate: 'servers'
        }
      })
      .state('servers.fix', {
        url: '/:serverId/fix',
        templateUrl: 'modules/servers/client/views/fix-server.client.view.html',
        data: {
          roles: ['root'],
          parent: 'storagemanagement',
          parentstate: 'servers'
        }
      })
      .state('servers.edit', {
        url: '/:serverId/edit',
        templateUrl: 'modules/servers/client/views/edit-server.client.view.html',
        data: {
          roles: featuresSettings.roles.server.update,
          parent: 'storagemanagement',
          parentstate: 'servers'
        }
      });
  }
]);
