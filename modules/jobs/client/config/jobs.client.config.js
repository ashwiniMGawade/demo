'use strict';

// Configuring the Jobs module
angular.module('jobs').run(['Menus',
  function (Menus) {

    // Add the Jobs dropdown list item
    Menus.addSubMenuItem('topbar', 'administration', {
      title: 'Jobs',
      state: 'jobs.list',
      type: 'dropdown',
      roles: featuresSettings.roles.job.list,
      position: 1,
      submenu: [{ 'name' : 'List Jobs', 'roles' : featuresSettings.roles.job.list, 'state': 'jobs.list' }]
    });

    
     //Add the applications dropdown item
     Menus.addSubMenuItem('topbar', 'administration', {
      title: 'Applications',
      state: 'applications.list',
      type: 'dropdown',
      roles: featuresSettings.roles.application.list,
      position: 0,
      submenu: [{ 'name' : 'List Applications', 'roles' : featuresSettings.roles.application.list, 'state': 'applications.list' }]
    });
    
  }
]);
