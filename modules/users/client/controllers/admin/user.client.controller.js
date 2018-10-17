'use strict';

// Users Admin controller
angular.module('users.admin').controller('UserController', ['$scope', '$state', '$http', 'Authentication', 'PasswordValidator', 'userResolve', 'Admin', 'Tenants', 'modalService', 'Flash', '$sanitize',
function ($scope, $state, $http, Authentication, PasswordValidator, userResolve, Admin, Tenants, modalService, Flash, $sanitize) {
  $scope.authentication = Authentication;
  $scope.popoverMsg = PasswordValidator.getPopoverMsg();
  $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
  $scope.isAdmin = Authentication.user.roles.indexOf('admin') !== -1;
  $scope.isPartner = Authentication.user.roles.indexOf('partner') !== -1;
  $scope.userAccessRoles = featuresSettings.roles.user;

  var flashTimeout = 3000;

  userResolve.$promise.then(function(data){
    $scope.user = data;    
    if ($scope.user.userId) {
      var userRoles = $scope.user.roles;
      if (userRoles.indexOf('admin') !== -1 || userRoles.indexOf('user') !== -1 || userRoles.indexOf('read') !== -1) {        
        $scope.updateUserRoles = [{ id:'user',name:'User' },{ id:'read',name:'Read' }, { id:'admin', name:'Admin' }];
      } 
      if (userRoles.indexOf('l1ops') !== -1 && $scope.isRoot) {        
        $scope.updateUserRoles = [{ id:'root',name:'Root' },{ id:'l1ops',name:'L1-Ops' }];
      } 
      $scope.user.roles = userRoles[0];
    }
  },function (error) {
    $state.go('admin.users');
    Flash.create('danger', '<strong ng-non-bindable>No user with that identifier has been found</strong>', flashTimeout, { class: '', id: '' }, true);
  });


  function throwFlashErrorMessage(message) {
    if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
      Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
    }
  }

  $scope.create = function (isValid) {
    $scope.error = null;

    if (!isValid) {
      $scope.$broadcast('show-errors-check-validity', 'userForm');
      return false;
    }

    // Create new User object
    var user = new Admin({
      firstName: $sanitize(this.firstName),
      lastName: $sanitize(this.lastName),
      email: $sanitize(this.email),
      phone: $sanitize(this.phone),
      username: $sanitize(this.username),
      password: $sanitize(this.password),
      tenantId: $sanitize(this.tenantId),
      provider: $sanitize(this.provider),
      providerCode: $sanitize(this.providerCode),
      roles: $sanitize(this.roles)
    });

    // Redirect after save
    user.$create(function (response) {
      $state.go('admin.users');
      Flash.create('success', '<strong ng-non-bindable>Successfully created the user!</strong>', 3000, { class: '', id: '' }, true);

      // Clear form fields
      $scope.firstName = '';
      $scope.lastName = '';
      $scope.email = '';
      $scope.phone = '';
      $scope.username = '';
      $scope.password = '';
      $scope.tenantId = '';
    }, function (errorResponse) {
      throwFlashErrorMessage(errorResponse.data.message);
    });
  };

  $scope.remove = function (user) {
    var modalOptions = {
      closeButtonText: 'Cancel',
      actionButtonText: 'Ok',
      headerText: 'Delete User?',
      bodyText: ['Are you sure you want to delete this User?']
    };

    modalService.showModal({}, modalOptions).then(function (result) {
      if (user) {
        user.$remove(function () {
          $state.go('admin.users');
          Flash.create('success', '<strong ng-non-bindable>Successfully deleted the user!</strong>', 3000, { class: '', id: '' }, true);
        }, function (errorResponse) {
          throwFlashErrorMessage(errorResponse.data.message);
        });
      }
    });
  };

  
  $scope.update = function (isValid) {
    if (!isValid) {
      $scope.$broadcast('show-errors-check-validity', 'userForm');
      return false;
    }

    var user = $scope.user;

    user.$update(function () {
      $state.go('admin.users');
      Flash.create('success', '<strong ng-non-bindable>Successfully updated the user!</strong>', 3000, { class: '', id: '' }, true);
    }, function (errorResponse) {
      throwFlashErrorMessage(errorResponse.data.message);
    });
  };

  $scope.find = function () {
    $scope.username = '';
    $scope.password = '';
    $scope.tenants = Tenants.query();
    $http.get('api/lookups/provider')
    .then(function(response) {
      $scope.validProviderToAssign = response.data;
      if($scope.authentication.user.roles.indexOf('partner') !== -1) {
        //Partner cant create user with provider 'local'
        $scope.validProviderToAssign.splice($scope.validProviderToAssign.indexOf('local'),1);          
      }
    });
  };

  $scope.populateProvider = function(tenant) {
    if ($scope.roles === 'root' || $scope.roles === 'partner' || $scope.roles === 'l1ops') {
      $scope.validProviderToAssign = ['local'];
      $scope.provider = 'local';
    } else {
      $http.get('api/lookups/provider')
      .then(function(response) {
        $scope.validProviderToAssign = response.data;
      });
    }
  };

  $scope.validRolesToAssign = [{ id:'user',name:'User' },{ id:'read',name:'Read' }];

  if ($scope.authentication.user.roles.indexOf('admin')!==-1 ||
      $scope.authentication.user.roles.indexOf('root')!==-1 ||
        $scope.authentication.user.roles.indexOf('partner')!==-1){
    $scope.validRolesToAssign.splice(0,0,{ id:'admin', name:'Admin' });
  }
  if ($scope.authentication.user.roles.indexOf('root')!==-1) {
    $scope.validRolesToAssign.splice(0,0,{ id:'partner', name:'Partner' });
  }
  if ($scope.authentication.user.roles.indexOf('root')!==-1){
    $scope.validRolesToAssign.splice(0,0,{ id:'root', name:'Root' });
    $scope.validRolesToAssign.splice(0,0,{ id:'l1ops', name:'L1-Ops' });
  }
}
]);
