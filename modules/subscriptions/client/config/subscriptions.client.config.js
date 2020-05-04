'use strict';

// Configuring the Subscriptions module
angular.module('subscriptions').run(['Menus',
  function (Menus) {

    // Add the Subscriptions dropdown list item
    // Menus.addSubMenuItem('topbar', 'administration', {
    //   title: 'Subscriptions',
    //   state: 'subscriptions.list',
    //   type: 'dropdown',
    //   roles: featuresSettings.roles.subscription.list,
    //   position: 4,
    //   submenu: [{ 'name' : 'List Subscriptions', 'roles' : featuresSettings.roles.subscription.list, 'state': 'subscriptions.list' },
    //             { 'name': 'Create Subscriptions', 'roles': featuresSettings.roles.subscription.create, 'state': 'subscriptions.create' }]
    // });
  }
]);
