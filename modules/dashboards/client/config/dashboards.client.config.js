'use strict';

// Menus here

angular.module('core.admin').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('topbar', 'health', {
        title: 'Clusters',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'health', {
        title: 'Nodes',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'health', {
        title: 'Aggregates',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'health', {
        title: 'Svms',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'health', {
        title: 'Volumes',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'health', {
        title: 'Luns',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });

  }]);