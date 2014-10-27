'use strict';
/*global alert*/

angular.module('SupAppIonic')
  .controller('EventsCtrl', function ($scope, $location, EventSrvc, $ionicSlideBoxDelegate, $cordovaDialogs, ContactSrvc, UserSrvc) {

    var viewingEvent = {};
    var currentUser = {};
    $scope.eventShown = 1;

    UserSrvc.getCurrentUser().then(function(result){
      currentUser = result;
    });

    EventSrvc.getEvents().then(function(events) {
      var prunedEvents = EventSrvc.removeOldEvents(events);
      
      var eventsUnsorted = [];

      // have to convert to array so that I can get the index from the ion-slide-change
      for (var key in prunedEvents) {
        prunedEvents[key].id = key;
        eventsUnsorted.push(prunedEvents[key]);
      }

      $scope.events = eventsUnsorted.sortBy('id', true);

      viewingEvent = $scope.events[0];

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
      } else if (minutesAgo < 80) {
        return 'a little over an hour ago';
      } else {
        return date.hoursAgo() + ' hours ago';
      }
    };

    $scope.newEvent = function () {
      $location.url('/new-event');
    };

    $scope.join = function(event) {
      console.log(event);
      var x = event.gesture.deltaX;
      var y = event.gesture.deltaY;

      angular.element('.action-button').css({'-webkit-transform': 'translate(' + x + 'px, ' + y + 'px)'});

      if (y < -200) {
        joinEvent();
      }
    };

    $scope.resetActionBtn = function(){
      angular.element('.action-button').css({'-webkit-transform': 'translate(0px, 0px)'});
    };

    $scope.eventViewingChanged = function(index) {
      viewingEvent = $scope.events[index];
    };

    $scope.createdEvent = function () {
      if (viewingEvent && currentUser) {
        return viewingEvent.createdBy === currentUser.contactId;
      } else {
        return false;
      }
    };

    $scope.deleteEvent = function() {
      EventSrvc.removeEvent(viewingEvent.id);
      var index = $scope.events.findIndex(function(event){
        return event.id === viewingEvent.id;
      });

      $scope.events.removeAt(index);
      $ionicSlideBoxDelegate.update();

      if ($scope.events.length) {
        viewingEvent = $scope.events[index];
      } else {
        viewingEvent = null;
      }
    };

    function joinEvent() {
      EventSrvc.addUserToEvent(currentUser);

      var index = $scope.events.findIndex(function(event){
        return event.id === viewingEvent.id;
      });

      $scope.events[index].peeps.push(EventSrvc.getUserObjForEvent(currentUser));
    }
  })
;
