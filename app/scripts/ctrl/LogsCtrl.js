'use strict';
/*global Firebase */

angular.module('SupAppIonic')
  .controller('LogsCtrl', function ($scope, $location, $firebase){
    var logsref = new Firebase('https://petri.firebaseio.com/logs');
    var syncLogs = $firebase(logsref);
    var syncedLogs = syncLogs.$asObject();
    syncedLogs.$bindTo($scope, 'logs');

    $scope.prettyDate = function(millis) {
      return Date.create(millis).relative();
    };
  })
;