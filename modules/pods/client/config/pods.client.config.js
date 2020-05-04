'use strict';

// Configuring the Pods module
angular.module('pods').run(['Menus',
  function (Menus) {

    // Add the pods dropdown item
    // Menus.addSubMenuItem('topbar', 'administration', {
    //   title: 'Pods',
    //   state: 'pods.list',
    //   type: 'dropdown',
    //   roles: featuresSettings.roles.pod.list,
    //   position: 2,
    //   submenu: [{ 'name' : 'List Pods', 'roles' : featuresSettings.roles.pod.list, 'state': 'pods.list' },
    //             { 'name': 'Create Pods', 'roles': featuresSettings.roles.pod.create, 'state': 'pods.create' }]
    // });

  }
]);
