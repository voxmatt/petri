'use strict';
/*global $, alert, $, Firebase */

angular.module('SupAppIonic')
  .controller('EventsCtrl', function ($scope, $rootScope, $location, $timeout, $firebase, $firebaseSimpleLogin, EventSrvc, $ionicSlideBoxDelegate, $cordovaDialogs, ContactSrvc, LocationSrvc) {

    var viewingEvent = {};
    var currentUser = {};
    var draggingElm = {};
    var coords = null;
    var hintTimeout = null;
    $scope.eventShown = 1;
    $scope.activeSlide = 1;
    $scope.user = currentUser || null;

    var ref = new Firebase('https://petri.firebaseio.com/events');
    var sync = $firebase(ref);
    var syncedEvents = sync.$asObject();
    syncedEvents.$bindTo($scope, 'events');

    syncedEvents.$loaded().then(function(){
      EventSrvc.removeOldEvents($scope.events);
      $ionicSlideBoxDelegate.update();
    });
    

    $rootScope.$on('userDefined', function(event, user){
      currentUser = user;
      $scope.user = currentUser;
      LocationSrvc.getLatLong().then(function(coordinates){
        coords = coordinates;
      });
      LocationSrvc.cacheFoursquare();
    });

    // EventSrvc.getEvents().then(function(events) {
    //   var prunedEvents = EventSrvc.removeOldEvents(events);
      
    //   var eventsUnsorted = [];

    //   // have to convert to array so that I can get the index from the ion-slide-change
    //   for (var key in prunedEvents) {
    //     prunedEvents[key].id = key;
    //     attachDistance(prunedEvents[key]);
    //     eventsUnsorted.push(prunedEvents[key]);
    //   }

    //   $scope.events = eventsUnsorted.sortBy('id', true);

    //   viewingEvent = $scope.events[0];

    //   $ionicSlideBoxDelegate.update();
    // }, function(error) {
    //   alert(error);
    // });

    $scope.loadContacts = function(){
      ContactSrvc.getAddressbookContacts().then(function(contacts) {
        $scope.contacts = contacts;
        console.log(contacts);
      }, function() {
        $cordovaDialogs.alert('Could not load contacts');
      });
    };

    $scope.getDistanceAway = function (eventObj) {
      return getDistanceAway(eventObj);
    };

    $scope.getTimeAgo = function() {
      var strMillis = this.$parent.timestamp;
      var date = Date.create(parseInt(strMillis));
      var minutesAgo = date.minutesAgo();
      if (minutesAgo < 60) {
        return minutesAgo + ' minutes ago';
      } else if (minutesAgo < 70) {
        return 'a little over an hour ago';
      } else if (minutesAgo < 80) {
        return 'an hour and a half ago';
      }  else if (minutesAgo < 110) {
        return 'almost two hours ago';
      }  else if (minutesAgo < 119) {
        return 'an hour ago';
      } else {
        return date.hoursAgo() + ' hours ago';
      }
    };

    $scope.newEvent = function () {
      $location.url('/new-event');
    };

    $scope.join = function(event) {
      var x = event.gesture.deltaX;
      var y = event.gesture.deltaY;
      var parent = $(event.gesture.target).parents('.primary-circle').length;
      var self = $(event.gesture.target).hasClass('primary-circle');
      var onImg = $(event.gesture.target).hasClass('event-location-photo');

      angular.element('.action-button').css({'-webkit-transform': 'translate(' + x + 'px, ' + y + 'px)'});

      if ((parent || self) && !onImg) {
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

    $scope.logout = function() {
      // var firebaseRef = new Firebase('https://petri.firebaseio.com/');
      // $firebaseSimpleLogin(firebaseRef).$logout();
    };

    $scope.dragStart = function(event){
      draggingElm = getOrbitCircle(event);
      if (hintTimeout) {
        $timeout.cancel(hintTimeout);
      }
    };

    $scope.draggingOption = function(event) {
      var translation = 'translate3d(' + event.gesture.deltaX + 'px,' + event.gesture.deltaY + 'px,0)';
      $(draggingElm).css({'transform': translation, '-webkit-transform': translation});
    };

    $scope.maybeSelectOption = function(event, peep) {
      var xPos = event.gesture.center.pageX;
      var yPos = event.gesture.center.pageY;
      
      if ( checkWithinPrimaryCircle(xPos, yPos) ) {
        $scope.selectedPeep = peep;
      }
      var translation = 'translate3d(0,0,0)';
      $('.orbit-circle-content').css({'transform': translation, '-webkit-transform': translation});
      
      // IMPORTANT!!!!!!!!!!!!!
      draggingElm = {};
    };

    $scope.resetSelectedPeep = function() {
      $scope.selectedPeep = null;
    };

    $scope.getUserOnEvent = function(event) {
      var userOnEvent = null;
      if (!$scope.user || !$scope.user.contactId) {
        return null;
      }
      userOnEvent = event.peeps.find(function(peep){
        return peep.id === $scope.user.contactId;
      });

      return userOnEvent;
    };

    $scope.getNumberOfEvents = function() {
      var count = 0;
      for (var key in $scope.events) {
        if (key[0] !== '$') {
          count++;
        }
      }
      return count;
    };

    $scope.slideHasChanged = function() {
      $scope.selectedPeep = null;
    };

    function joinEvent() {
      EventSrvc.addUserToEvent(currentUser);

      var index = $scope.events.findIndex(function(event){
        return event.id === viewingEvent.id;
      });

      $scope.events[index].peeps.push(EventSrvc.getUserObjForEvent(currentUser));
    }

    function getDistanceAway(eventObj) {
      if (eventObj.location && eventObj.location.location && coords) {
        var lat1 = coords.latitude;
        var lon1 = coords.longitude;
        var lat2 = eventObj.location.location.lat;
        var lon2 = eventObj.location.location.lng;

        var kms = LocationSrvc.getDistanceBtwn(lat1, lon1, lat2, lon2);
        var meters = kms / 1000;
        return LocationSrvc.getStaticDistanceAway(meters);

      } 
    }

    function getOrbitCircle(event) {
      // note that this fails if we're traversing down the dom tree and there are
      // multiple children on a node; shouldn't be a problem given our structure on the
      // circles, but worth noting
      var parentOrbitElem = event.target;
      var childOrbitElem = event.target;
      var orbitElem = null;
      var i = 0;

      while (!orbitElem && i < 4) {
        if ($(parentOrbitElem).hasClass('orbit-circle-content')) {
          orbitElem = parentOrbitElem;
        } else if ($(childOrbitElem).hasClass('orbit-circle-content')) {
          orbitElem = childOrbitElem;
        } else {
          parentOrbitElem = parentOrbitElem.parentElement;
          childOrbitElem = childOrbitElem.children[0];
        }
        
        i++;
      }

      return orbitElem;
    }

    function checkWithinPrimaryCircle(xPos, yPos, side) {
      // this crappy, crappy function is needed due to bullshit in mobile safari
      var circleDimensions = document.getElementsByClassName('primary-circle')[$scope.activeSlide - 1].getBoundingClientRect();
      var radius = circleDimensions.width / 2;

      // next we have to get the center of the circle on the page to calibrate our x,y positioning
      var circleCenterX = circleDimensions.left + radius;
      var circleCenterY = circleDimensions.top + radius;
      var xPlot = xPos - circleCenterX;
      var yPlot = yPos - circleCenterY;

      // circle is defined by x^2 + y^2 = r^2
      if ( (xPlot * xPlot) + (yPlot * yPlot) <= (radius * radius) ) {
        if (side) {
          return (side === 'left' && xPlot < 0) || (side === 'right' && xPlot >= 0);
        } else {
          return true;
        }
      } else {
        return false;
      }
    }
  })
;
