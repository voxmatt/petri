'use strict';

angular.module('SupAppIonic')

	.factory('EventSrvc', function($q, Firebase, UserSrvc, PhoneSrvc, LoggingSrvc) {

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

		function getEvent(id){
			var d = $q.defer();

			ref.child(id).on('value', function(snapshot) {
				d.resolve(snapshot.val());
			}, function(error) {
				d.reject(error);
			});

			return d.promise;
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

		////////////////////////
		//	Sending Invites		//
		////////////////////////

		function sendInvites(eventObj, eventId, isEditingExisting, adding, inviting, currentUser, registeredNumbers) {

			var inviteTexts = getInviteTexts(eventObj, adding, eventId);

			if (inviting && inviting.length) {

				inviting.forEach(function(invitee){
					var text = inviteTexts.reg;

					if (!invitee.registered) {
						text = inviteTexts.nonReg + invitee.id;
					}

					invitee.numbers.forEach(function(number){
						PhoneSrvc.sendMessage(number, text, currentUser.contactId);
						LoggingSrvc.addLog('invite', currentUser, text, false);
					});

				});

			}

			if (isEditingExisting && adding && adding.length) {
				var text = inviteTexts.join;

				eventObj.peeps.forEach(function(peep){
					if (adding.indexOf(peep) !== -1) {
						return;
					}

					peep.numbers.forEach(function(number){
						PhoneSrvc.sendMessage(number, text, currentUser.contactId);
						LoggingSrvc.addLog('join', currentUser, text, false);
					});
				});
			}

			if (!isEditingExisting) {
				registeredNumbers.forEach(function(number) {
					PhoneSrvc.sendMessage(number, inviteTexts.notif, currentUser.contactId);
				});
			}
		}

		function getListOfPeepsText(peeps) {
			var text = '';
			var num = peeps.length;

			peeps.each(function(peep, index) {
				if (peep.name.fullName) {
					text += peep.name.fullName;
				}

				if (index === num -1) {
					// last one, do nothing
				} else if (index === num - 2) {
					// second to last, need an 'and'
					text += (num === 2) ? ' and ' : ', and ';
				} else if (index !== num) {
					// otherwise, it's comma time
					text += ', ';
				}
			});

			return text;
		}

		function getInviteTexts(eventObj, adding, eventId) {
			
			var inviteMessage, notifMessage, joinMessage;
			var appUrl = 'petri://event?=' + eventId;
			var webUrl = 'https://petri.firebaseapp.com/#/respond/' + eventId;

			if (eventObj.peeps.length > 1) {
				inviteMessage = getListOfPeepsText(eventObj.peeps) + ' want you to join';
				notifMessage = getListOfPeepsText(eventObj.peeps);
			}

			if (adding && adding.length) {
				var isAre = (adding.length > 1) ? ' are ' : ' is ';
				joinMessage = getListOfPeepsText(adding) + isAre + 'joining you at ' + eventObj.location.name;
			}

			switch (eventObj.type) {
				case 'Music':
				case 'Drinks':
				case 'Food':
				case 'Dancin\'':
					inviteMessage += ' for some ' + eventObj.type.toLowerCase();
					notifMessage += ' are going out for ' + eventObj.type.toLowerCase();
					break;
				case 'Movie':
					inviteMessage += ' for a movie';
					notifMessage += ' are going to see a movie';
					break;
				case 'Out doors':
					inviteMessage += ' up to hang outdoors';
					notifMessage += ' are going to hang outdoors';
					break;
				case 'Chillin\'':
					inviteMessage += ' up to hang out';
					notifMessage += ' are going to hang out';
					break;
			}

			inviteMessage += ' at ' + eventObj.location.name + '.';
			notifMessage += ' at ' + eventObj.location.name + '.' + ' Check it out: ' + appUrl;

			return {
				reg: inviteMessage + ' Check it out: ' + appUrl,
				nonReg: inviteMessage + ' Respond here: ' + webUrl + '/',
				notif: notifMessage,
				join: joinMessage
			};
		}

		return {
			getEvents: getEvents,
			getEvent: getEvent,
			saveEvent: saveEvent,
			updateEvent: updateEvent,
			removeEvent: removeEvent,
			removeOldEvents: removeOldEvents,
			addUserToEvent: addUserToEvent,
			getUserObjForEvent: getUserObjForEvent,
			sendInvites: sendInvites
		};
	}
);