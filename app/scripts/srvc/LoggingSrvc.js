'use strict';
/* global Firebase */

angular.module('SupAppIonic').factory('LoggingSrvc', function() {

  var logRef = new Firebase('https://petri.firebaseio.com/logs');

  function addLog(logString) {
    logRef.child(Date.now()).update(logString);
  }

  function getLogs() {

  }

  return {
    addLog: addLog,
    getLogs: getLogs
  };
});