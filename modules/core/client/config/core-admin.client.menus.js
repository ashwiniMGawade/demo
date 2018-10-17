'use strict';

angular.module('core.admin').run(['Menus',
  function (Menus) {
    
  	// Add the Administration dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Administration',
      state: 'administration',
      type: 'dropdown',
      roles: ['admin', 'root', 'user', 'read', 'partner', 'l1ops'],
      position:0
    });

    // Add the Storage Management dropdown item
    var roles = ['admin', 'root', 'user', 'read', 'l1ops'];

    // add partner role only if partner user has access to any of the storage module list operation
    // checked only list operation as , if other access are present list will always be there
    if (featuresSettings.roles.server.list.indexOf('partner') > -1 ||
       featuresSettings.roles.storagegroup.list.indexOf('partner') > -1 || 
       featuresSettings.roles.storageunit.list.indexOf('partner') > -1 || 
       featuresSettings.roles.icr.list.indexOf('partner') > -1 ) {
      roles.push('partner');
    }

    Menus.addMenuItem('topbar', {
      title: 'Storage Management',
      state: 'storagemanagement',
      type: 'dropdown',
      roles: roles,
      position:1
    });
   
    // Add the reports menu item
    Menus.addMenuItem('topbar', {
      title: 'Support',
      state: 'support',
      type: 'dropdown',
      roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
      position:3
    });

    // Add the dropdown list item
   
  }
]);
