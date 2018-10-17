'use strict';

// Setting up route
angular.module('icrs').config(['$stateProvider',
  function ($stateProvider) {
    // Icrs state routing
    $stateProvider
      .state('icrs', {
        abstract: true,
        url: '/icrs',
        template: '<ui-view/>'
      })
      .state('icrs.list', {
        url: '',
        templateUrl: 'modules/icrs/client/views/list-icrs.client.view.html',
        controller: 'IcrListController',
        data: {
          roles: featuresSettings.roles.icr.list,
          parent: 'storagemanagement',
          parentstate: 'icrs'
        }
      })
      .state('icrs.create', {
        url: '/create',
        templateUrl: 'modules/icrs/client/views/create-icr.client.view.html',
        data: {
          roles: featuresSettings.roles.icr.create,
          parent: 'storagemanagement',
          parentstate: 'icrs'
        }
      })
      .state('icrs.view', {
        url: '/:icrId',
        templateUrl: 'modules/icrs/client/views/view-icr.client.view.html',
        data: {
          roles: featuresSettings.roles.icr.read,
          parent: 'storagemanagement',
          parentstate: 'icrs'
        }
      })
      .state('icrs.edit', {
        url: '/:icrId/edit',
        templateUrl: 'modules/icrs/client/views/edit-icr.client.view.html',
        data: {
          roles: featuresSettings.roles.icr.update,
          parent: 'storagemanagement',
          parentstate: 'icrs'
        }
      });
  }
]);
