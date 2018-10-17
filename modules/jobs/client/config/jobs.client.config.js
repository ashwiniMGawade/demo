'use strict';

// Configuring the Jobs module
angular.module('jobs').run(['Menus',
  function (Menus) {

    // Add the Jobs dropdown list item
    Menus.addSubMenuItem('topbar', 'administration', {
      title: 'Jobs',
      state: 'jobs',
      type: 'dropdown',
      roles: featuresSettings.roles.job.list,
      position: 1,
      submenu: [{ 'name' : 'List Jobs', 'roles' : featuresSettings.roles.job.list, 'state': 'jobs.list' }]
    });
  }
]);
