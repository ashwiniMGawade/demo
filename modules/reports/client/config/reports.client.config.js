'use strict';

// Configuring the Reports module
angular.module('reports').run(['Menus',
    function (Menus) {
      // Add the reports menu item
      Menus.addMenuItem('topbar', {
        title: 'Reports',
        state: 'reports',
        type: 'dropdown',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position:2
      });

      // Add the dropdown list item
      Menus.addSubMenuItem('topbar', 'reports', {
        title: 'List Reports',
        state: 'reports.list',
        roles:  ['user', 'admin', 'root', 'partner', 'read', 'l1ops']
      });
    }
  ])
  .constant('PER_PAGE', 10);
