'use strict';
/*global $, Firebase */

angular.module('SupAppIonic')
  .controller('EventsCtrl', function ($scope, $rootScope, $state, $stateParams, $location,
                                      $timeout, $firebase, $firebaseSimpleLogin, EventSrvc,
                                      $ionicSlideBoxDelegate, $cordovaDialogs, ContactSrvc,
                                      LocationSrvc, StateSrvc, $ionicActionSheet, UserSrvc,
                                      LoggingSrvc) {

    ////////////////////////
    //        INIT        //
    ////////////////////////

    var viewingEvent = {};
    var preEventSlides = 2;
    var currentUser = UserSrvc.getUserLocally();
    var draggingElm = {};
    var coords = null;
    var hintTimeout = null;
    var eventKeyMap = {};
    var eventIndexMap = {};
    $scope.eventShown = 1;
    $scope.activeSlide = 1;
    $scope.user = currentUser || null;
    $scope.moreOptions = {show: false};

    var ref = new Firebase('https://petri.firebaseio.com/events');
    var sync = $firebase(ref);
    var syncedEvents = sync.$asObject();
    syncedEvents.$bindTo($scope, 'events');

    syncedEvents.$watch(function(){
      $ionicSlideBoxDelegate.update();
    });

    syncedEvents.$loaded().then(function(){
      EventSrvc.removeOldEvents($scope.events);
      $ionicSlideBoxDelegate.update();
      
      // need to create a map of slide indexes to event keys
      var i = 0;
      var keyArray = [];
      for (var key in $scope.events) {
        // first create an array of keys
        if ($scope.events.hasOwnProperty(key) && key[0] !== '$') {
          keyArray.push(key);
          i++;
        }
      }
      // now sort in descending order (because that's how events are sorted)
      keyArray.sort(function(a, b){return b-a;});

      // now they're in the same order as the slides, so we can map them
      keyArray.forEach(function(key, i){
        eventKeyMap[i + preEventSlides] = key;
        eventIndexMap[key] = i + preEventSlides;
      });

      LocationSrvc.getLatLong().then(function(coordinates){
        coords = coordinates;
      });

      var eventId = StateSrvc.getViewingEventId();

      console.log(eventId);

      if (eventId) {
        var index = eventIndexMap[eventId];
        if (index) {
          $scope.activeSlide = index;
        }
      }

      UserSrvc.getCurrentUser().then(function(user){
        currentUser = user;
        var logMsg = 'seen in app';
        LoggingSrvc.addLog('online', user, logMsg, false);
      });
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

    $scope.getTimeAgo = function(timestamp) {
      var strMillis = timestamp;
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

    $scope.resetActionBtn = function(){
      angular.element('.action-button').css({'-webkit-transform': 'translate(0px, 0px)'});
    };

    $scope.createdEvent = function () {
      if (viewingEvent && currentUser) {
        return viewingEvent.createdBy === currentUser.contactId;
      } else {
        return false;
      }
    };

    $scope.logout = function() {
      var ref = new Firebase('https://petri.firebaseio.com/');
      $firebaseSimpleLogin(ref).$logout();
    };

    $scope.dragStart = function(event){
      draggingElm = getOrbitCircle(event);
      if (hintTimeout) {
        $timeout.cancel(hintTimeout);
      }
    };

    $scope.dragStartActionBtn = function(event){
      if (!$scope.createdEvent()) {
        draggingElm = event.target;
        if (hintTimeout) {
          $timeout.cancel(hintTimeout);
        }
      }
    };

    $scope.draggingOption = function(event) {
      var translation = 'translate3d(' + event.gesture.deltaX + 'px,' + event.gesture.deltaY + 'px,0)';
      $(draggingElm).css({'transform': translation, '-webkit-transform': translation});
    };

    $scope.maybeSelectOption = function(event, peep, type) {
      var xPos = event.gesture.center.pageX;
      var yPos = event.gesture.center.pageY;
      var selected = checkWithinPrimaryCircle(xPos, yPos);
      if ( selected && !type) {
        $scope.selectedPeep = peep;
      } else if ( selected && type === 'join' && !$scope.createdEvent()) {
        joinEvent();
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

    $scope.slideHasChanged = function(index) {
      $scope.selectedPeep = null;
      viewingEvent = $scope.events[eventKeyMap[index]];
    };

    $scope.moreOptionsClose = function(){
      $scope.moreOptions.show = false;
    };

    $scope.getDirections = function(event) {
      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: 'Open in Apple Maps' },
          { text: 'Open in Google Maps' }
        ],
        cancelText: 'Cancel',
        cancel: function() {
          hideSheet();
        },
        buttonClicked: function(index) {
          var url = 'http://maps.apple.com/?q=';
          if (index === 0) {
            url += event.location.name;
            url += '&spn=';
          } else if (index === 1) {
            url = 'comgooglemaps://?q=';
            url += event.location.name;
            url += '&center=';
          }
          url += event.location.location.lat + ',';
          url += event.location.location.lng;
          window.open(url,'_system','location=yes');
        }
      });
    };

    $scope.editSheet = function(passedEvent) {
      var sheet = {
        buttons: [
          { text: 'Add or Invite People' }
        ],
        cancelText: 'Cancel',
        cancel: function() {
          editSheet();
        },
        buttonClicked: function() {
          StateSrvc.setEditingEvent(passedEvent);
          $location.url('/new-event');
        }
      };

      if ($scope.createdEvent()) {
        sheet.destructiveText = 'Delete';
        sheet.destructiveButtonClicked = function() {
          deleteEvent(passedEvent);
          editSheet();
        };
      }

      var editSheet = $ionicActionSheet.show(sheet);
    };

    function joinEvent() {
      if (viewingEvent.peeps) {
        var peep = EventSrvc.getUserObjForEvent(currentUser);
        peep.registered = true;
        viewingEvent.peeps.push(peep);
        LoggingSrvc.addLog('join', currentUser, 'joined event', false);

        UserSrvc.getRegisteredUsers().then(function(numbers){
          EventSrvc.sendInvites(viewingEvent, [peep], [],  true, [], currentUser, numbers);
        }, function(){
          LoggingSrvc.addLog('notification', currentUser, 'failed to get registered user numbers', true);
        });
      }
    }

    function deleteEvent(passedEvent) {
      EventSrvc.removeEvent(passedEvent.key);

      LoggingSrvc.addLog('delete', currentUser, 'deleted event', false);

      $state.transitionTo($state.current, $stateParams, {
        reload: true,
        inherit: false,
        notify: true
      });
    }

    function getDistanceAway(eventObj) {

      coords = coords || LocationSrvc.getLatLongLocally();

      if (eventObj.location && eventObj.location.location) {
        var lat1 = coords.latitude;
        var lon1 = coords.longitude;
        var lat2 = eventObj.location.location.lat;
        var lon2 = eventObj.location.location.lng || eventObj.location.location.long;

        var kms = LocationSrvc.getDistanceBtwn(lat1, lon1, lat2, lon2);
        var meters = kms * 1000;
        var distanceObj = LocationSrvc.getStaticDistanceAway(meters);
        return distanceObj.display;
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
