'use strict';

// Configuring the Stirage units module
angular.module('eseries-storageunits').run(['Menus',
  function (Menus) {
    // Add the Storage Units dropdown item
    Menus.addSubMenuItem('topbar', 'storagemanagement', {
      title: 'Eseries Storage Units',
      state: 'eseries-storageunits.list',
      type: 'dropdown',
      roles: featuresSettings.roles.storageunit.list,
      position: 3,
      submenu: [{ 'name' : 'List Storage Units', 'roles' : featuresSettings.roles.storageunit.list, 'state': 'eseries-storageunits.list' },
                { 'name': 'Create Storage Units', 'roles': featuresSettings.roles.storageunit.create, 'state': 'eseries-storageunits.create' }]
    });

  }
]);
