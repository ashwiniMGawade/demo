'use strict';

// Configuring the Applications module
angular.module('applications').run(['Menus',
  function (Menus) {

    // //Add the applications dropdown item
    // Menus.addSubMenuItem('topbar', 'administration', {
    //   title: 'Applications',
    //   state: 'applications.list',
    //   type: 'dropdown',
    //   roles: featuresSettings.roles.application.list,
    //   position: 10,
    //   submenu: [{ 'name' : 'List Applications', 'roles' : featuresSettings.roles.application.list, 'state': 'applications.list' }]
    // });
    
    // console.log("called in applications,", Menus);
  }
]);
