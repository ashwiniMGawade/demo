'use strict';

// Setting up route
angular.module('jobs').config(['$stateProvider',
  function ($stateProvider) {
    // jobs state routing
    $stateProvider
      .state('jobs', {
        abstract: true,
        url: '/jobs',
        template: '<ui-view/>'
      })
      .state('jobs.list', {
        url: '',
        templateUrl: 'modules/jobs/client/views/list-jobs.client.view.html',
        controller: 'JobListController',
        data: {
          roles: featuresSettings.roles.job.list,
          parent: 'administration',
          parentstate: 'jobs'
        }
      })
      .state('jobs.view', {
        url: '/:jobId',
        templateUrl: 'modules/jobs/client/views/view-job.client.view.html',
        data: {
          roles: featuresSettings.roles.job.read,
          parent: 'administration',
          parentstate: 'jobs'
        }
      });
  }
]);
