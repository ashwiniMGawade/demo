'use strict';

// Configuring the Backups module
angular.module('backups').run(['Menus',
  function (Menus) {

    // Add the backup dropdown item
    Menus.addSubMenuItem('topbar', 'dataProtection', {
      title: 'Backup',
      state: 'backups.list',
      type: 'dropdown',
      roles: featuresSettings.roles.backup.list,
      position: 2,
      submenu: [{ 'name' : 'List Backups', 'roles' : featuresSettings.roles.backup.list, 'state': 'backups.list' },
                { 'name': 'Create Backup', 'roles': featuresSettings.roles.backup.create, 'state': 'backups.create' }]
    });

  }
]);
