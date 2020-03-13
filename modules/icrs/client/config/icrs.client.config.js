'use strict';

// Configuring the Icms module
angular.module('icrs').run(['Menus',
  function (Menus) {

    // Add the icrs dropdown item
    // Menus.addSubMenuItem('topbar', 'storagemanagement', {
    //   title: 'ICR',
    //   state: 'icrs',
    //   type: 'dropdown',
    //   roles: featuresSettings.roles.icr.list,
    //   position: 4,
    //   submenu: [{ 'name' : 'List Inter-cluster Relationship', 'roles' : featuresSettings.roles.icr.list, 'state': 'icrs.list' },
    //             { 'name': 'Create Inter-cluster Relationship', 'roles': featuresSettings.roles.icr.create, 'state': 'icrs.create' }]
    // });
  }
]);
