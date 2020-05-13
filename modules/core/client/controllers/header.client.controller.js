'use strict';

angular.module('core')
.config(['KeepaliveProvider', 'IdleProvider', function(KeepaliveProvider, IdleProvider){
  IdleProvider.idle((expiryTime/60000 - 1)*60); // (expireTimeInMinutes -1) in seconds
  console.log((expiryTime/60000 - 1)*60);
  IdleProvider.timeout(1); // after 30 seconds idle, time the user out
  KeepaliveProvider.interval(5); // 5 minute keep-alive ping
  IdleProvider.interrupt("keydown mousedown click");
}])
.run(function($rootScope, $window, Authentication) {
    $rootScope.$on('IdleTimeout', function() {
      console.log("timedout");
      console.log(Authentication.user.provider);
      // end their session and redirect to login
       $window.location.href = '/api/auth/signout?provider='+Authentication.user.provider;
    });    
})
.filter('moment', function () {
  return function (input, momentFn /*, param1, param2, ...param n */) {
    var args = Array.prototype.slice.call(arguments, 2),
        momentObj = moment(input);
    return momentObj[momentFn].apply(momentObj, args);
  };
})
.filter('intersect', function() {  
  return function(arr1, arr2){
    var intersectArray = [];
    if (angular.isArray(arr1) && angular.isArray(arr2)) {
      arr1.filter(function(n) {  
        if (arr2.indexOf(n) !== -1 && intersectArray.indexOf(n) === -1) {          
         intersectArray.push(n);
        }
      });   
     return intersectArray.length;
   }    
  };
})
.controller('HeaderController', ['$rootScope', '$scope', '$state', '$filter', 'Authentication', 'Menus', '$window', 'Notifications', 'Flash', 'modalService', '$interval', '$sanitize', 'Idle', 'Admin', 'Support', 'Browser', '$stateParams',
  function ($rootScope, $scope, $state, $filter, Authentication, Menus, $window, Notifications, Flash, modalService, $interval, $sanitize, Idle, Admin, Support, Browser, $stateParams) {
    
    if (Browser.getBrowser() !== 'chrome' && angular.element(document.getElementsByClassName("alert-warning")).length === 0) {
      Flash.create('warning', '<strong ng-non-bindable>' + $sanitize("Please use Google Chrome for best results on the Virtual Storage portal.") + '</strong>', 900000, { class: '', id: '' }, true);
    }

    $scope.$state = $state;
    $scope.authentication = Authentication;  
    $scope.notificationAccessRoles = featuresSettings.roles.notification;
    $scope.singleMenus = ['reports.list', 'support.portal-user-guide', 'support.portal-user-api-guide', 'support.portal-iscsi-host-setup-guide'];
    //$scope.doubleMenus = ['support.downloads.software({software:"OCUM"})', 'support.downloads.software({software:"cloud-manager"})', 'support.downloads.software({software:"ontapdsm"})'];
    $scope.doubleMenus = [];
    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');
    console.log($scope.menu);

    // $scope.$on('$viewContentLoaded', function(){
    //   //Here your view content is fully loaded !!
    //   console.log("content loaded")
    //   Luci.Navigation.init();
    // });

    $scope.getState = function(state, name) {
      if (state =='dashboards.details' || state =='dashboards.eseriesDetails') {
        $state.go(state, {type: angular.lowercase(name)});
      } else {
        $state.go(state)
      }
    }

    $scope.getChildClass = function(item) { 
      if ($stateParams.type === angular.lowercase(item.title)) {
        return 'luci-navigation__link--is-active'
      } else {
        var currentStateSplit = $state.current.name.split('.');
        var itemStateSplit = item.state.split('.')
        return  ($state.current.name === item.state || currentStateSplit[0] == itemStateSplit[0] ) && $stateParams.type == undefined ? 'luci-navigation__link--is-active': '';
      }      
    }

    $scope.getParentClass = function(name) {
      // console.log("parent", name, $state.current)
      if ($state.current.data) {
        return $state.current.data.parent === name ? 'luci-navigation__link--is-active  luci-navigation__link--is-expanded': ''
      }
      return  '';
    }


    $scope.toggleSubMenu = function($event, toggle) {     
      if (toggle) {        
        $event.stopPropagation();
      }
    }

    $scope.toggleChildMenu = function($event) {
      $event.stopPropagation();
      angular.element(document.getElementsByClassName('dropdown')).removeClass("open");
    }


    $rootScope.$on('IdleWarn', function() {
      console.log("called IdleWarn");
    });

    $rootScope.$on('IdleEnd', function() {
      console.log("called IdleEnd");
    });

    $rootScope.$on('IdleStart', function() {
      console.log("IdleStart called");
    });

    $scope.acceptTermsAndCondition = function() {
      var support = new Support();

      support.$create(function (res) {
        $scope.authentication.user = res;          
      }, function (errorResponse) {
        throwFlashErrorMessage(errorResponse.data.message);
      });
    }; 

    $scope.startIdle = function() {
      if($scope.authentication.user) {
        console.log("Start the Idle watch");
        Idle.watch();
        // show the warning for terms and conditions       
      }
    }; 

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
    
    // Initiate IDP login routes
    $scope.idpLogin = function (){
      //$location.path('/login');
      $window.location.href = '/login';
    };
    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + $sanitize(message) + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    $scope.getMessageTypeClass = function(category) {
      switch(category) {
        case 'Information' : return 'info-sign';
        case 'Scheduled Maintenance' : return 'question-sign';
        case 'Unscheduled Maintenance' : return 'exclamation-sign';
        default: return 'ok-sign';
      }
    };

    $scope.getNotificationUnreadCount = function(pollingParams) {
      var count = 0;
      $scope.notificationMessages =  Notifications.query(pollingParams, function(notifications) {
        if ($scope.notificationMessages.length > 5) {
          $scope.showReadMoreLink = true;
        }
        angular.forEach($scope.notificationMessages, function(value) {
          count += !value.acknowledge ? 1 : 0;
        });
        $scope.notificationUnreadCount = count;
      });
    };

    if (Authentication.user && Authentication.user.tenant !== null && 
      $filter('intersect')($scope.notificationAccessRoles.list, Authentication.user.roles) && 
      $filter('intersect')($scope.notificationAccessRoles.update, Authentication.user.roles)) {

      var reloadCnt = 0 , pollingParams = {} ;
      
        $scope.getNotificationUnreadCount(pollingParams);
        //Refresh the contents of the page after every 60 seconds
        var refreshData = $interval(function() {
          reloadCnt++;
          if (reloadCnt > 1){
            pollingParams.ispolling = 1 ;
          }
          $scope.getNotificationUnreadCount(pollingParams); }, featuresSettings.pageRefresh);
        $scope.$on('$destroy', function(){
          $interval.cancel(refreshData);
        });
      }
     


    $scope.markAsRead = function(notification) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: notification.summary,
        bodyText: [notification.message]
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        notification.$update(function () {
          $scope.getNotificationUnreadCount();
        }, function (errorResponse) {
          throwFlashErrorMessage(errorResponse.data.message);
        });
      });
    };
  }
]);
