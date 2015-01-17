'use strict';

angular.module('SupAppIonic').factory('NotificationSrvc', function(){
  var NotificationSrvc = {};
  var pushNotification;
  var pushEnabled = false;
  var defaultPermissions = {
    badge: true,
    sound: false,
    ecb: onNotificationAPN
  };

  NotificationSrvc.initPushServices = function() {
    pushNotification = window.plugins.pushNotification;
    pushNotification.register(tokenHandler, errorHandler, defaultPermissions);
    pushEnabled = true;
  };

  NotificationSrvc.isPushEnabled = function() {
    return pushEnabled;
  };

  function onNotificationAPN (event) {
    if (event.alert) {
      navigator.notification.alert(event.alert);
    }

    if (event.sound) {
        // var snd = new Media(event.sound);
        // snd.play();
    }

    if (event.badge) {
      pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
  }

  function tokenHandler(result) {
    console.log(result);
  }

  function successHandler(result) {
    console.log(result);
  }

  function errorHandler(error) {
    console.log(error);
  }

  return NotificationSrvc;
});