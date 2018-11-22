'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window',
  function ($window, $localStorage) {
    
    var setHeader = function(username, password) {
    	auth.user.header = btoa(username+':'+password)
    	$window.user = auth.user;
    	$window.localStorage.setItem('header',auth.user.header);
    } 
    var auth = {
      user: $window.user,
      setHeader:setHeader
    };
    
    return auth;
  }
]);
