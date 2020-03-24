'use strict';

// Configuring the Replicas module
angular.module('replicas').run(['Menus',
  function (Menus) {

    // Add the replicas dropdown item
    Menus.addSubMenuItem('topbar', 'dataProtection', {
      title: 'Replicas',
      state: 'replicas.list',
      type: 'dropdown',
      roles: featuresSettings.roles.replica.list,
      position: 2,
      submenu: [{ 'name' : 'List Replicas', 'roles' : featuresSettings.roles.replica.list, 'state': 'replicas.list' },
                { 'name': 'Create Replicas', 'roles': featuresSettings.roles.replica.create, 'state': 'replicas.create' }]
    });

  }
]);
