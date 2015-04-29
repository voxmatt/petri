'use strict';
/* global Firebase */

angular.module('SupAppIonic').factory('TrackingSrvc', function(TrackingCnst) {

    var logRef = new Firebase('https://petri.firebaseio.com/tracking');

    function addLog(key, userId) {
        var timeStamp = Date.now();
        var logObj = {
            type: key,
            userId: userId,
            time: timeStamp
        };
        logRef.child(userId).child(timeStamp).set(key);
        logRef.child(key).child(timeStamp).set(logObj);
    }

    function registered(userId) {
        var key = TrackingCnst.EVENT_TYPES.REGISTERED;
        addLog(key, userId);
    }

    function joinedEvent(userId) {
        var key = TrackingCnst.EVENT_TYPES.JOINED_EVENT;
        addLog(key, userId);
    }

    function createdEvent(userId) {
        var key = TrackingCnst.EVENT_TYPES.CREATED_EVENT;
        addLog(key, userId);
    }

    function inviteSent(userId) {
        var key = TrackingCnst.EVENT_TYPES.INVITE_SENT;
        addLog(key, userId);
    }

    function appOpened(userId) {
        var key = TrackingCnst.EVENT_TYPES.APP_OPENED;
        addLog(key, userId);
    }

    function deletedEvent(userId) {
        var key = TrackingCnst.EVENT_TYPES.DELETED_EVENT;
        addLog(key, userId);
    }

    return {
        registered: registered,
        joinedEvent: joinedEvent,
        createdEvent: createdEvent,
        inviteSent: inviteSent,
        appOpened: appOpened,
        deletedEvent: deletedEvent
    };
});
