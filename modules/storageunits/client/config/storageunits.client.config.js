'use strict';

// Configuring the Stirage units module
angular.module('storageunits').run(['Menus',
  function (Menus) {

    // Add the Storage Units dropdown item
    Menus.addSubMenuItem('topbar', 'storagemanagement', {
      title: 'Storage Units',
      state: 'storageunits',
      type: 'dropdown',
      roles: featuresSettings.roles.storageunit.list,
      position: 3,
      submenu: [{ 'name' : 'List Storage Units', 'roles' : featuresSettings.roles.storageunit.list, 'state': 'storageunits.list' },
                { 'name': 'Create Storage Units', 'roles': featuresSettings.roles.storageunit.create, 'state': 'storageunits.create' }]
    });
  }
]);
