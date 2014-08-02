'use strict';

angular.module('SupAppIonic')

  .factory('EventSrvc', function($firebase) {
    var ref = new Firebase('https://sup-test.firebaseio.com/events');
    return $firebase(ref);
  }
);