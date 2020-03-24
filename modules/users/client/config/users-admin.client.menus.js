'use strict';

// Configuring the Articles module
angular.module('users.admin').run(['Menus',
  function (Menus) {

    // Add the Users dropdown list item
    Menus.addSubMenuItem('topbar', 'administration', {
      title: 'Users',
      state: 'admin.users',
      type: 'dropdown',
      roles: featuresSettings.roles.user.list,
      position: 7,
      submenu: [{ 'name' : 'List Users', 'roles' : featuresSettings.roles.user.list, 'state': 'admin.users' },
                { 'name': 'Create Users', 'roles': featuresSettings.roles.user.create, 'state': 'admin.create' }]
    });
  }
]);
