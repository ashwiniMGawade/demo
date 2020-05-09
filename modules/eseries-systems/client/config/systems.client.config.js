'use strict';

// Configuring the Pods module
angular.module('systems').run(['Menus',
  function (Menus) {
    // Add the pods dropdown item
    var t= Menus.addSubMenuItem('topbar', 'administration', {
      title: 'Eseries Systems',
      state: 'systems.list',
      type: 'dropdown',
      roles: featuresSettings.roles.system.list,
      position: 8,
      submenu: [{ 'name' : 'List Eseries Systems', 'roles' : featuresSettings.roles.system.list, 'state': 'systems.list' },
                { 'name': 'Create Eseries Systems', 'roles': featuresSettings.roles.system.create, 'state': 'systems.create' }]
    });
  }
]);
