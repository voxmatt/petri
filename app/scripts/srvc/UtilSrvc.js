'use strict';

angular.module('SupAppIonic')
  .factory('UtilSrvc', function() {

    function watchUntil($scope, watchExpression, fn, equality) {
      var removeFn = $scope.$watch(watchExpression, function (newVal, oldVal) {
        if (fn(newVal, oldVal)) {
          removeFn();
        }
      }, equality);
      return removeFn;
    }

    function watchUntilTruthy($scope, watchExpression, fn, equality) {
      return watchUntil($scope, watchExpression, function (newVal, oldValue) {
        if (!!newVal) {
          fn(newVal, oldValue);
          return true;
        }
        return false;
      }, equality);
    }

    return {
      watchUntil: watchUntil,
      watchUntilTruthy: watchUntilTruthy
    };
  })
;