'use strict';

// Configuring the Pods module
angular.module('clusters').run(['Menus',
  function (Menus) {
    // Add the pods dropdown item
    var t= Menus.addSubMenuItem('topbar', 'administration', {
      title: 'Ontap Clusters',
      state: 'clusters.list',
      type: 'dropdown',
      roles: featuresSettings.roles.cluster.list,
      position: 8,
      submenu: [{ 'name' : 'List Clusters', 'roles' : featuresSettings.roles.cluster.list, 'state': 'clusters.list' },
                { 'name': 'Create Clusters', 'roles': featuresSettings.roles.cluster.create, 'state': 'clusters.create' }]
    });
  }
]);
