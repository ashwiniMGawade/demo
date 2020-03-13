'use strict';

// Configuring the Tenants module
angular.module('tenants').run(['Menus',
  function (Menus) {

    // Add the tenants dropdown item
    // Menus.addSubMenuItem('topbar', 'administration', {
    //   title: 'Tenants',
    //   state: 'tenants',
    //   type: 'dropdown',
    //   roles: featuresSettings.roles.tenant.list,
    //   position: 6,
    //   submenu: [{ 'name' : 'List Tenants', 'roles' : featuresSettings.roles.tenant.list, 'state': 'tenants.list' },
    //             { 'name': 'Create Tenants', 'roles': featuresSettings.roles.tenant.create, 'state': 'tenants.create' }]
    // });
  }
]);
