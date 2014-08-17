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

		return {
			getEvents: getEvents
		};
	}
);