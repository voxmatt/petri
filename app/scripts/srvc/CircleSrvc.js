'use strict';
/* global $ */

angular.module('SupAppIonic').factory('CircleSrvc', function(){

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
    var circleDimensions = document.getElementsByClassName('primary-circle')[0].getBoundingClientRect();
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

  return {
    getOrbitCircle: getOrbitCircle,
    checkWithinPrimaryCircle: checkWithinPrimaryCircle
  };
});