'use strict';

// Setting up route
angular.module('sites').config(['$stateProvider',
  function ($stateProvider) {
    // Sites state routing
    $stateProvider
      .state('sites', {
        abstract: true,
        url: '/sites',
        template: '<ui-view/>'
      })
      .state('sites.list', {
        url: '',
        templateUrl: 'modules/sites/client/views/list-sites.client.view.html',
        controller: 'SitesListController',
        data: {
          roles: featuresSettings.roles.site.list,
          parent: 'administration',
          parentstate: 'sites'
        }
      })
      .state('sites.create', {
        url: '/create',
        templateUrl: 'modules/sites/client/views/create-site.client.view.html',
        data: {
          roles: featuresSettings.roles.site.create,
          parent: 'administration',
          parentstate: 'sites'
        }
      })
      .state('sites.view', {
        url: '/:siteId',
        templateUrl: 'modules/sites/client/views/view-site.client.view.html',
        data: {
          roles: featuresSettings.roles.site.read,
          parent: 'administration',
          parentstate: 'sites'
        }
      })
      .state('sites.edit', {
        url: '/:siteId/edit',
        templateUrl: 'modules/sites/client/views/edit-site.client.view.html',
        data: {
          roles: featuresSettings.roles.site.update,
          parent: 'administration',
          parentstate: 'sites'
        }
      });
  }
]);
