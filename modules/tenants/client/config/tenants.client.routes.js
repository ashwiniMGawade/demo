'use strict';

// Setting up route
angular.module('tenants').config(['$stateProvider',
  function ($stateProvider) {
    // Tenants state routing
    $stateProvider
      .state('tenants', {
        abstract: true,
        url: '/tenants',
        template: '<ui-view/>'
      })
      .state('tenants.list', {
        url: '',
        templateUrl: 'modules/tenants/client/views/list-tenants.client.view.html',
        controller: 'TenantListController',
        data: {
          roles: featuresSettings.roles.tenant.list,
          parent: 'administration',
          parentstate: 'tenants'
        }
      })
      .state('tenants.create', {
        url: '/create',
        templateUrl: 'modules/tenants/client/views/create-tenant.client.view.html',
        data: {
          roles: featuresSettings.roles.tenant.create,
          parent: 'administration',
          parentstate: 'tenants'
        }
      })
      .state('tenants.view', {
        url: '/:tenantId',
        templateUrl: 'modules/tenants/client/views/view-tenant.client.view.html',
        data: {
          roles: featuresSettings.roles.tenant.read,
          parent: 'administration',
          parentstate: 'tenants'
        }
      })
      .state('tenants.edit', {
        url: '/:tenantId/edit',
        templateUrl: 'modules/tenants/client/views/edit-tenant.client.view.html',
        data: {
          roles: featuresSettings.roles.tenant.update,
          parent: 'administration',
          parentstate: 'tenants'
        }
      });
  }
]);
