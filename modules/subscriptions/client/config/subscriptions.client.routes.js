'use strict';

// Setting up route
angular.module('subscriptions').config(['$stateProvider',
  function ($stateProvider) {
    // Subscriptions state routing
    $stateProvider
      .state('subscriptions', {
        abstract: true,
        url: '/subscriptions',
        template: '<ui-view/>'
      })
      .state('subscriptions.list', {
        url: '',
        templateUrl: 'modules/subscriptions/client/views/list-subscriptions.client.view.html',
        controller: 'SubscriptionsListController',
        data: {
          roles: featuresSettings.roles.subscription.list,
          parent: 'administration',
          parentstate: 'subscriptions'
        }
      })
      .state('subscriptions.create', {
        url: '/create',
        templateUrl: 'modules/subscriptions/client/views/create-subscription.client.view.html',
        data: {
          roles: featuresSettings.roles.subscription.create,
          parent: 'administration',
          parentstate: 'subscriptions'
        }
      })
      .state('subscriptions.view', {
        url: '/:subscriptionId',
        templateUrl: 'modules/subscriptions/client/views/view-subscription.client.view.html',
        data: {
          roles: featuresSettings.roles.subscription.read,
          parent: 'administration',
          parentstate: 'subscriptions'
        }
      })
      .state('subscriptions.edit', {
        url: '/:subscriptionId/edit',
        templateUrl: 'modules/subscriptions/client/views/edit-subscription.client.view.html',
        data: {
          roles: featuresSettings.roles.subscription.update,
          parent: 'administration',
          parentstate: 'subscriptions'
        }
      });
  }
]);
