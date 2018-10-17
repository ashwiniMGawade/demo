'use strict';

// Setting up route
angular.module('users.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController',
        data: {
          roles: featuresSettings.roles.user.list,
          parent: 'administration',
          parentstate: 'admin'
        }
      })
      .state('admin.create', {
        url: '/users/create',
        templateUrl: 'modules/users/client/views/admin/create-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.query({
              userId: $stateParams.userId
            });
          }]
        },
        data: {
          roles: featuresSettings.roles.user.create,
          parent: 'administration',
          parentstate: 'admin'
        }
      })
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        },
        data: {
          roles: featuresSettings.roles.user.read,
          parent: 'administration',
          parentstate: 'admin'
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        },
        data: {
          roles: featuresSettings.roles.user.update,
          parent: 'administration',
          parentstate: 'admin'
        }
      })
      .state('admin.signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html',
        data: {
          roles: ['admin', 'root', 'partner', 'l1ops', 'read', 'user'],
          parent: 'administration',
          parentstate: 'admin'
        }
      });
  }
]);
