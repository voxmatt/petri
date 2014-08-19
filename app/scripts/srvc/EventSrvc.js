'use strict';

angular.module('SupAppIonic')

	.factory('EventSrvc', function($q, Firebase) {
		var ref = new Firebase('https://sup-test.firebaseio.com/events');

		function getEvents(){
			var deferred = $q.defer();

			ref.on('value', function(snapshot) {
				deferred.resolve(snapshot.val());
			}, function(error) {
				deferred.reject(error);
			});

			return deferred.promise;
		}

		function saveEvent(newEvent){

			var deferred = $q.defer();
			var cleanEvent = angular.copy(newEvent);
			var key = Date.now();

			ref.child(key).set(cleanEvent, function(error){
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve(cleanEvent);
				}
			});

			return deferred.promise;
		}

		return {
			getEvents: getEvents,
			saveEvent: saveEvent
		};
	}
);