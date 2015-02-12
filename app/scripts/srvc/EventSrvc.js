'use strict';

angular.module('SupAppIonic')

	.factory('EventSrvc', function($q, Firebase, UserSrvc) {

		var eventHalfLife = 3; // in hours - change this here

		var ref = new Firebase('https://petri.firebaseio.com/events');

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

			if (newEvent.key) {
				return updateEvent(newEvent.key, cleanEvent);
			} else {
				cleanEvent.key = key;
			}

			ref.child(key).set(cleanEvent, function(error){
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve(key);
				}
			});

			return deferred.promise;
		}

		function updateEvent(eventId, data) {
			var d = $q.defer();
			
			ref.child(eventId).update(data, function(error){
				if (error) {
					d.reject(error);
				}	else {
					d.resolve('Event Updated');
				}
			});

			return d.promise;
		}

		function removeEvent(eventId) {
			ref.child(eventId).remove();
		}

		function removeOldEvents(events) {

			var millisHalflife = eventHalfLife * 60 * 60 * 1000;
			var timeHorizon = Date.now() - millisHalflife;

			for (var key in events) {
				if (events.hasOwnProperty(key)) {
					if (Number(key) < timeHorizon) {
						removeEvent(key);
						delete events[key];
					}
				}
			}

			return events;
		}

		function addUserToEvent(eventId, userId) {

			var d = $q.defer();

			if (!userId) {
				userId = UserSrvc.getCurrentUserId();
			}

			UserSrvc.getUser(userId).then(function(user){
				var userObj = getUserObjForEvent(user);
				ref.child(eventId).child('peeps').push(userObj, function(error) {
					if (error) {
						d.reject(error);
					} else {
						d.resolve(userObj);
					}
				});

			}, function(error) {
				d.reject(error);
			});

			return d.promise;
		}

		function getUserObjForEvent(rawUser, userId) {

			if (!userId && !rawUser.contactId) {
				// sorry, we need some sort of id
				return null;
			} else if (rawUser.contactId) {
				userId = rawUser.contactId;
			}

			var userObj = {
				id: userId,
				name: {
					firstName: rawUser.firstName || '',
					abbName: rawUser.firstName || '',
					initials: rawUser.firstName[0] || ''
				},
				dupeNumbers: rawUser.dupeNumbers || null
			};
					
			if (rawUser.lastName) {
				userObj.name.abbName += ' ' + rawUser.lastName[0] + '.';
				userObj.name.fullName = rawUser.firstName + ' ' + rawUser.lastName;
				userObj.name.initials += rawUser.lastName[0];
			}

			userObj.numTimesIncluded = rawUser.numTimesIncluded || 0;

			return userObj;
		}

		return {
			getEvents: getEvents,
			saveEvent: saveEvent,
			updateEvent: updateEvent,
			removeEvent: removeEvent,
			removeOldEvents: removeOldEvents,
			addUserToEvent: addUserToEvent,
			getUserObjForEvent: getUserObjForEvent
		};
	}
);