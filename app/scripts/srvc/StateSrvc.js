'use strict';

angular.module('SupAppIonic')
	.factory('StateSrvc', function () {
    
    var editingEvent;
    var viewingEventId;
		
    function setEditingEvent(event) {
			editingEvent = event;
		}

    function getEditingEvent() {
      var event = editingEvent;
      editingEvent = null;
      return event;
    }

    function setViewingEventId(eventId) {
      viewingEventId = eventId;
    }

    function getViewingEventId() {
      var eventId = viewingEventId;
      viewingEventId = null;
      return eventId;
    }

		return {
			setEditingEvent: setEditingEvent,
			getEditingEvent: getEditingEvent,
      setViewingEventId: setViewingEventId,
      getViewingEventId: getViewingEventId
		};
	})
;