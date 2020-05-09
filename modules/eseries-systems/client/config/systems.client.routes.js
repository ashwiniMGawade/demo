'use strict';

// Setting up route
angular.module('systems').config(['$stateProvider',
  function ($stateProvider) {
    // systems state routing
    $stateProvider
      .state('systems', {
        abstract: true,
        url: '/systems',
        template: '<ui-view/>'
      })
      .state('systems.list', {
        url: '',
        templateUrl: 'modules/eseries-systems/client/views/list-systems.client.view.html',
        controller: 'SystemsListController',
        data: {
          roles: featuresSettings.roles.system.list,
          parent: 'administration',
          parentstate: 'systems'
        }
      })
      .state('systems.create', {
        url: '/create',
        templateUrl: 'modules/eseries-systems/client/views/create-system.client.view.html',
        data: {
          roles: featuresSettings.roles.system.create,
          parent: 'administration',
          parentstate: 'systems'
        }
      })
      .state('systems.view', {
        url: '/:systemId',
        templateUrl: 'modules/eseries-systems/client/views/view-system.client.view.html',
        data: {
          roles: featuresSettings.roles.system.read,
          parent: 'administration',
          parentstate: 'systems'
        }
      })
      .state('systems.edit', {
        url: '/:systemId/edit',
        templateUrl: 'modules/eseries-systems/client/views/edit-system.client.view.html',
        data: {
          roles: featuresSettings.roles.system.update,
          parent: 'administration',
          parentstate: 'systems'
        }
      });
  }
]);
