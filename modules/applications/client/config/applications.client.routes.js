'use strict';

// Setting up route
angular.module('applications').config(['$stateProvider',
  function ($stateProvider) {
    // Applications state routing
    $stateProvider
      .state('applications', {
        abstract: true,
        url: '/applications',
        template: '<ui-view/>'
      })
      .state('applications.list', {
        url: '',
        templateUrl: 'modules/applications/client/views/list-applications.client.view.html',
        controller: 'ApplicationListController',
        data: {
          roles: featuresSettings.roles.application.list,
          parent: 'administration',
          parentstate: 'applications'
        }
      })
      .state('applications.create', {
        url: '/create',
        templateUrl: 'modules/applications/client/views/create-application.client.view.html',
        data: {
          roles: featuresSettings.roles.application.create,
          parent: 'administration',
          parentstate: 'applications'
        }
      })
      .state('applications.view', {
        url: '/:applicationId',
        templateUrl: 'modules/applications/client/views/view-application.client.view.html',
        data: {
          roles: featuresSettings.roles.application.read,
          parent: 'administration',
          parentstate: 'applications'
        }
      })
      .state('applications.edit', {
        url: '/:applicationId/edit',
        templateUrl: 'modules/applications/client/views/edit-application.client.view.html',
        data: {
          roles: featuresSettings.roles.application.update,
          parent: 'administration',
          parentstate: 'applications'
        }
      });
  }
]);
