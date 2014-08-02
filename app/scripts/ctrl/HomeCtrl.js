'use strict';

angular.module('SupAppIonic')
  .controller('HomeCtrl', function ($scope, $location, EventSrvc) {

    $scope.eventShown = 1;
    $scope.events = EventSrvc;

    $scope.changeEvent = function (direction) {

      var numEvents = $scope.events.$getIndex().length, step = $scope.eventShown;

      if (direction === 'previous') {
        step = step - 1;
      } else if (direction === 'next') {
        step = step + 1;
      }

      if (step > numEvents) {
        step = numEvents;
      } else if (step < 1) {
        step = 1;
      }

      $scope.eventShown = step;
    };


    $scope.getLabel = function (eventType) {
      if (eventType) {
        return eventType.toLowerCase() + ' at';
      }
      return 'event at';
    };

    $scope.newEvent = function () {
      $location.url('/new-event');
    };
  })
;
