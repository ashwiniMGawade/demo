'use strict';

// Menus here

angular.module('core.admin').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('topbar', 'ontapHealth', {
        title: 'Clusters',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'ontapHealth', {
        title: 'Nodes',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'ontapHealth', {
        title: 'Aggregates',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'ontapHealth', {
        title: 'Svms',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'ontapHealth', {
        title: 'Volumes',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'ontapHealth', {
        title: 'Luns',
        state: 'dashboards.details',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });


    Menus.addSubMenuItem('topbar', 'eseriesHealth', {
        title: 'Asups',
        state: 'dashboards.eseriesDetails',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'eseriesHealth', {
        title: 'Controllers',
        state: 'dashboards.eseriesDetails',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'eseriesHealth', {
        title: 'Drives',
        state: 'dashboards.eseriesDetails',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'eseriesHealth', {
        title: 'Interfaces',
        state: 'dashboards.eseriesDetails',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'eseriesHealth', {
        title: 'Pools',
        state: 'dashboards.eseriesDetails',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'eseriesHealth', {
        title: 'Systems',
        state: 'dashboards.eseriesDetails',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });
    Menus.addSubMenuItem('topbar', 'eseriesHealth', {
        title: 'Volumes',
        state: 'dashboards.eseriesDetails',
        roles: ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
        position: 7,
    });   

  }]);