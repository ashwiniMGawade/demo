'use strict';

// Setting up route
angular.module('backups').config(['$stateProvider',
  function ($stateProvider) {
    // backup state routing
    $stateProvider
      .state('backups', {
        abstract: true,
        url: '/backups',
        template: '<ui-view/>'
      })
      .state('backups.list', {
        url: '',
        templateUrl: 'modules/ontap_backup/client/views/list-backups.client.view.html',
        controller: 'BackupsListController',
        data: {
          roles: featuresSettings.roles.backup.list,
          parent: 'dataProtection',
          parentstate: 'backups'
        }
      })
      .state('backups.create', {
        url: '/create',
        templateUrl: 'modules/ontap_backup/client/views/create-backup.client.view.html',
        data: {
          roles: featuresSettings.roles.backup.create,
          parent: 'dataProtection',
          parentstate: 'backups'
        }
      })
      .state('backups.view', {
        url: '/:backupId',
        templateUrl: 'modules/ontap_backup/client/views/view-backup.client.view.html',
        data: {
          roles: featuresSettings.roles.backup.read,
          parent: 'dataProtection',
          parentstate: 'backups'
        }
      })
      .state('backups.edit', {
        url: '/:backupId/edit',
        templateUrl: 'modules/ontap_backup/client/views/edit-backup.client.view.html',
        data: {
          roles: featuresSettings.roles.backup.update,
          parent: 'dataProtection',
          parentstate: 'backups'
        }
      });
  }
]);
