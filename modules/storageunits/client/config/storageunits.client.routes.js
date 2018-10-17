'use strict';

// Setting up route
angular.module('storageunits').config(['$stateProvider',
  function ($stateProvider) {
    // storageunits state routing
    $stateProvider
      .state('storageunits', {
        abstract: true,
        url: '/storageunits',
        template: '<ui-view/>'
      })
      .state('storageunits.list', {
        url: '',
        templateUrl: 'modules/storageunits/client/views/list-storageunits.client.view.html',
        controller: 'StorageunitsListController',
        data: {
          roles: featuresSettings.roles.storageunit.list,
          parent: 'storagemanagement',
          parentstate: 'storageunits'
        }
      })
      .state('storageunits.create', {
        url: '/create',
        templateUrl: 'modules/storageunits/client/views/create-storageunit.client.view.html',
        data: {
          roles: featuresSettings.roles.storageunit.create,
          parent: 'storagemanagement',
          parentstate: 'storageunits'
        }
      })
      .state('storageunits.view', {
        url: '/:storageunitId',
        templateUrl: 'modules/storageunits/client/views/view-storageunit.client.view.html',
        data: {
          roles: featuresSettings.roles.storageunit.read,
          parent: 'storagemanagement',
          parentstate: 'storageunits'
        }
      })
      .state('storageunits.edit', {
        url: '/:storageunitId/edit',
        templateUrl: 'modules/storageunits/client/views/edit-storageunit.client.view.html',
        data: {
          roles: featuresSettings.roles.storageunit.update,
          parent: 'storagemanagement',
          parentstate: 'storageunits'
        }
      })      
      .state('storageunits.fix', {
        url: '/:storageunitId/fix',
        templateUrl: 'modules/storageunits/client/views/fix-storageunit.client.view.html',
        data: {
          roles: ['root'],
          parent: 'storagemanagement',
          parentstate: 'storageunits'
        }
      });
  }
]);
