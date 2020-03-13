'use strict';

// Configuring the Subtenants module
angular.module('subtenants').run(['Menus',
  function (Menus) {

    // Add the subtenants dropdown item
  //   Menus.addSubMenuItem('topbar', 'administration', {
  //     title: 'Subtenants',
  //     state: 'subtenants',
  //     type: 'dropdown',
  //     roles: featuresSettings.roles.subtenant.list,
  //     position: 5,
  //     submenu: [{ 'name' : 'List Subtenants', 'roles' : featuresSettings.roles.subtenant.list, 'state': 'subtenants.list' },
  //               { 'name': 'Create Subtenants', 'roles': featuresSettings.roles.subtenant.create, 'state': 'subtenants.create' }]
  //   });
  }
]);
