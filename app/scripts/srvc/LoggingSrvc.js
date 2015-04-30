'use strict';
/* global Firebase */

angular.module('SupAppIonic').factory('LoggingSrvc', function() {

    var logRef = new Firebase('https://petri.firebaseio.com/logs');

    function addLog(logType, user, logString, error) {
        var logObj = {
            type: logType,
            user: user,
            message: logString || '',
            error: error || false,
            time: Date.now()
        };
        logRef.child(Date.now()).update(logObj);
    }

    function getLogs() {

    }

    return {
        addLog: addLog,
        getLogs: getLogs
    };
});
