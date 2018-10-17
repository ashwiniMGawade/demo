'use strict';

// Setting up route
angular.module('storagegroups').config(['$stateProvider',
  function ($stateProvider) {
    // Storagegroups state routing
    $stateProvider
      .state('storagegroups', {
        abstract: true,
        url: '/storagegroups',
        template: '<ui-view/>'
      })
      .state('storagegroups.list', {
        url: '',
        templateUrl: 'modules/storagegroups/client/views/list-storagegroups.client.view.html',
        controller: 'StoragegroupListController',
        data: {
          roles: featuresSettings.roles.storagegroup.list,
          parent: 'storagemanagement',
          parentstate: 'storagegroups'
        }
      })
      .state('storagegroups.create', {
        url: '/create',
        templateUrl: 'modules/storagegroups/client/views/create-storagegroup.client.view.html',
        data: {
          roles: featuresSettings.roles.storagegroup.create,
          parent: 'storagemanagement',
          parentstate: 'storagegroups'
        }
      })
      .state('storagegroups.view', {
        url: '/:storagegroupId',
        templateUrl: 'modules/storagegroups/client/views/view-storagegroup.client.view.html',
        data: {
          roles: featuresSettings.roles.storagegroup.read,
          parent: 'storagemanagement',
          parentstate: 'storagegroups'
        }
      })
      .state('storagegroups.fix', {
        url: '/:storagegroupId/fix',
        templateUrl: 'modules/storagegroups/client/views/fix-storagegroup.client.view.html',
        data: {
          roles: ['root'],
          parent: 'storagemanagement',
          parentstate: 'storagegroups'
        }
      })
      .state('storagegroups.edit', {
        url: '/:storagegroupId/edit',
        templateUrl: 'modules/storagegroups/client/views/edit-storagegroup.client.view.html',
        data: {
          roles: featuresSettings.roles.storagegroup.update,
          parent: 'storagemanagement',
          parentstate: 'storagegroups'
        }
      })
      .state('snapshots', {
        abstract: true,
        url: '/storagegroups/:storagegroupId/snapshots',
        template: '<ui-view/>',
         data: {
          roles: featuresSettings.roles.snapshot.list
        }
      })
      .state('snapshots.list', {
        url: '',
        templateUrl: 'modules/storagegroups/client/views/list-storagegroup-snapshots.client.view.html',
        controller: 'SnapshotsListController',
        data: {
          roles: featuresSettings.roles.snapshot.list,
          parent: 'storagemanagement',
          parentstate: 'storagegroups'
        }
      });
  }
]);
