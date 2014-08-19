'use strict';
/*global alert*/

angular.module('SupAppIonic')
  .controller('EventsCtrl', function ($scope, $location, EventSrvc, $ionicSlideBoxDelegate, $cordovaDialogs, ContactSrvc) {

    $scope.eventShown = 1;

    EventSrvc.getEvents().then(function(events) {
      $scope.events = events;
      $ionicSlideBoxDelegate.update();
    }, function(error) {
      alert(error);
    });

    $scope.loadContacts = function(){
      ContactSrvc.getAddressbookContacts().then(function(contacts) {
        $scope.contacts = contacts;
        console.log(contacts);
      }, function() {
        $cordovaDialogs.alert('Could not load contacts');
      });
    };

    $scope.getLabel = function (eventType) {
      if (eventType) {
        return eventType.toLowerCase() + ' at';
      }
      return 'event at';
    };

    $scope.getTimeAgo = function(strMillis) {
      var date = Date.create(parseInt(strMillis));
      var minutesAgo = date.minutesAgo();
      if (minutesAgo < 70) {
        return minutesAgo + ' minutes ago';
      } else if (70 < minutesAgo < 80) {
        return 'a little over an hour ago';
      } else {
        return date.hoursAgo() + ' hours ago';
      }
    };

    $scope.newEvent = function () {
      $location.url('/new-event');
    };
  })
;
