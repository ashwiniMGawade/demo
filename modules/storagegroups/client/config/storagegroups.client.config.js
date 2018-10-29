'use strict';

// Configuring the Storagegroups module
angular.module('storagegroups').run(['Menus',
  function (Menus) {

    // Add the storagegroups dropdown item
    Menus.addSubMenuItem('topbar', 'storagemanagement', {
      title: 'Storage Groups',
      state: 'storagegroups',
      type: 'dropdown',
      roles: featuresSettings.roles.storagegroup.list,
      position: 2,
      submenu: [{ 'name' : 'List Storage Groups', 'roles' : featuresSettings.roles.storagegroup.list, 'state': 'storagegroups.list' },
                { 'name': 'Create Storage Groups', 'roles': featuresSettings.roles.storagegroup.create, 'state': 'storagegroups.create' }]
    });
  }
]);