'use strict';

// Configuring the Sites module
angular.module('sites').run(['Menus',
  function (Menus) {

    // var siteList = featuresSettings.roles.site.list;
    // siteList.splice(siteList.indexOf('admin'),1);
    // siteList.splice(siteList.indexOf('read'),1);
    // siteList.splice(siteList.indexOf('user'),1);

    // Add the sites dropdown item
    // Menus.addSubMenuItem('topbar', 'administration', {
    //   title: 'Sites',
    //   state: 'sites.list',
    //   type: 'dropdown',
    //   roles: featuresSettings.roles.site.list,
    //   position: 3,
    //   submenu: [{ 'name' : 'List Sites', 'roles' : featuresSettings.roles.site.list, 'state': 'sites.list' },
    //             { 'name': 'Create Sites', 'roles': featuresSettings.roles.site.create, 'state': 'sites.create' }]
    // });
  }
]);
