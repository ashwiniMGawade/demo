'use strict';

// Configuring the Notifications module
angular.module('notifications').run(['Menus',
  function (Menus) {

    // Add the Notifications dropdown list item
    // Menus.addSubMenuItem('topbar', 'administration', {
    //   title: 'Notifications',
    //   state: 'notifications',
    //   type: 'dropdown',
    //   roles: featuresSettings.roles.notification.list,
    //   position: 1,
    //   submenu: [{ 'name' : 'List Notifications', 'roles' : featuresSettings.roles.notification.list, 'state': 'notifications.list' },
    //             { 'name': 'Create Notification', 'roles': featuresSettings.roles.notification.create, 'state': 'notifications.create' }]
    // });

  }
]);
