'use strict';

//jobs Jobs service used for communicating with the jobs REST endpoints
angular.module('jobs').factory('Jobs', ['$resource',
  function ($resource) {
    return $resource('api/jobs/:jobId', {
      jobId: '@jobId'
    }, {});
  }
]);
