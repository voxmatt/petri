'use strict';

angular.module('SupAppIonic')
	.factory('StateSrvc', function () {
    
    var editingEvent;
		
    function setEditingEvent(event) {
			editingEvent = event;
		}

    function getEditingEvent() {
      var event = editingEvent;
      editingEvent = null;
      return event;
    }

		return {
			setEditingEvent: setEditingEvent,
			getEditingEvent: getEditingEvent
		};
	})
;