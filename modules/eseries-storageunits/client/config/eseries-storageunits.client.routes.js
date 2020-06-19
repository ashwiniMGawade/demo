'use strict';

// Setting up route
angular.module('eseries-storageunits').config(['$stateProvider',
  function ($stateProvider) {
    // eseries-storageunits state routing
    $stateProvider
      .state('eseries-storageunits', {
        abstract: true,
        url: '/eseries-storageunits',
        template: '<ui-view/>'
      })
      .state('eseries-storageunits.list', {
        url: '',
        templateUrl: 'modules/eseries-storageunits/client/views/list-eseries-storageunits.client.view.html',
        controller: 'EseriesStorageunitsListController',
        data: {
          roles: featuresSettings.roles.storageunit.list,
          parent: 'storagemanagement',
          parentstate: 'eseries-storageunits'
        }
      })
      .state('eseries-storageunits.create', {
        url: '/create',
        templateUrl: 'modules/eseries-storageunits/client/views/create-eseries-storageunit.client.view.html',
        data: {
          roles: featuresSettings.roles.storageunit.create,
          parent: 'storagemanagement',
          parentstate: 'eseries-storageunits'
        }
      })
      .state('eseries-storageunits.view', {
        url: '/:storageunitId',
        templateUrl: 'modules/eseries-storageunits/client/views/view-eseries-storageunit.client.view.html',
        data: {
          roles: featuresSettings.roles.storageunit.read,
          parent: 'storagemanagement',
          parentstate: 'eseries-storageunits'
        }
      })
      .state('eseries-storageunits.edit', {
        url: '/:storageunitId/edit',
        templateUrl: 'modules/eseries-storageunits/client/views/edit-eseries-storageunit.client.view.html',
        data: {
          roles: featuresSettings.roles.storageunit.update,
          parent: 'storagemanagement',
          parentstate: 'eseries-storageunits'
        }
      })      
      .state('eseries-storageunits.fix', {
        url: '/:storageunitId/fix',
        templateUrl: 'modules/eseries-storageunits/client/views/fix-eseries-storageunit.client.view.html',
        data: {
          roles: ['root'],
          parent: 'storagemanagement',
          parentstate: 'eseries-storageunits'
        }
      });
  }
]);
