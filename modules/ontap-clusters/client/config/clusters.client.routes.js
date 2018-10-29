'use strict';

// Setting up route
angular.module('clusters').config(['$stateProvider',
  function ($stateProvider) {
    // clusters state routing
    $stateProvider
      .state('clusters', {
        abstract: true,
        url: '/clusters',
        template: '<ui-view/>'
      })
      .state('clusters.list', {
        url: '',
        templateUrl: 'modules/ontap-clusters/client/views/list-clusters.client.view.html',
        controller: 'ClustersListController',
        data: {
          roles: featuresSettings.roles.cluster.list,
          parent: 'administration',
          parentstate: 'clusters'
        }
      })
      .state('clusters.create', {
        url: '/create',
        templateUrl: 'modules/ontap-clusters/client/views/create-cluster.client.view.html',
        data: {
          roles: featuresSettings.roles.cluster.create,
          parent: 'administration',
          parentstate: 'clusters'
        }
      })
      .state('clusters.view', {
        url: '/:clusterId',
        templateUrl: 'modules/ontap-clusters/client/views/view-cluster.client.view.html',
        data: {
          roles: featuresSettings.roles.cluster.read,
          parent: 'administration',
          parentstate: 'clusters'
        }
      })
      .state('clusters.edit', {
        url: '/:clusterId/edit',
        templateUrl: 'modules/ontap-clusters/client/views/edit-cluster.client.view.html',
        data: {
          roles: featuresSettings.roles.cluster.update,
          parent: 'administration',
          parentstate: 'clusters'
        }
      });
  }
]);
