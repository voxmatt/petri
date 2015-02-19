'use strict';
/* global $ */

angular.module('SupAppIonic')
	.controller('NewEventCtrl', function ($scope, $q, $location, $timeout, EventSrvc,
																				LocationSrvc, ContactSrvc, UserSrvc, PhotoSrvc,
																				PhoneSrvc, EventCnst, StateSrvc, CircleSrvc,
																				LoggingSrvc) {

    ////////////////////////
    //        INIT        //
    ////////////////////////

		var newEvent, draggingElm, hintTimeout, currentText, allPeeps, steps, nextPeepIndex,
		currentUser, currentUserNumber, existingEvent;

		function reset() {
			draggingElm = {};
			hintTimeout = null;
			currentText = '';
			allPeeps = {};
			currentUser = {};
			currentUserNumber = null;
			existingEvent = null;
			steps = EventCnst.STEPS;
			$scope.loading = false;
			$scope.moreOptions = { show: false, title: '', optons: []};
			$scope.peepDragging = {status: false};
		}

		(function init() {

			reset();
			newEvent = StateSrvc.getEditingEvent();
			existingEvent = newEvent && angular.copy(newEvent);

			if (newEvent && newEvent.location) {
				$scope.step = steps.PEEPS;
				$scope.loading = true;

				ContactSrvc.getContacts().then(function(contacts){
					if (newEvent.peeps) {
						newEvent.peeps.each(function(peep){
							if (contacts[peep.id] && peep.joinTime) {
								contacts[peep.id].isSelected = true;
							} else if (contacts[peep.id]) {
								contacts[peep.id].isInvited = true;
							}
						});
					}
					nextPeepIndex = 10;
					allPeeps = processPeeps(contacts);

					var newStep = steps.PEEPS;
					newStep.options = allPeeps.slice(0,9);
					newStep.numOrbitCircles = newStep.options.length + 1;

					$scope.moreOptions.show = false;
					$scope.step = newStep;
				}, function(){
					console.log('failed to get contacts');
				}).finally(function(){
					$scope.loading = false;
				});
			} else {
				newEvent = {};
				$scope.step = steps.TYPE;
			}

		})();

		$scope.selectOption = function(num, option, isInvite){

			if (num === 1){
				newEvent.type = option.name;
				$scope.loading = true;

				LocationSrvc.getFoursquareVenues(10, option.section, option.category).then(function(result){
					var newStep = steps.LOCATION;

					newStep.options = result.locations;
					newStep.section = option.section;
					newStep.category = option.category;
					newStep.numOrbitCircles = newStep.options.length + 1;

					$scope.moreOptions.show = false;
					$scope.step = newStep;
				}, function(error){
					console.log(error);
				}).finally(function(){
					$scope.loading = false;
				});

				addCurrentUserToEvent();

			} else if (num === 2){
				$scope.loading = true;

				if (typeof option === 'string') {
					LocationSrvc.createVenue(option).then(function(venue){
						newEvent.location = venue;
					});
				} else {
					newEvent.location = option;
				}

				ContactSrvc.getContacts().then(function(contacts){
					nextPeepIndex = 10;
					allPeeps = processPeeps(contacts);

					var newStep = steps.PEEPS;
					newStep.options = allPeeps.slice(0,9);
					newStep.numOrbitCircles = newStep.options.length + 1;

					$scope.moreOptions.show = false;
					$scope.step = newStep;
				}, function(){
					console.log('failed to get contacts');
				}).finally(function(){
					$scope.loading = false;
				});
				
			} else if (num === 3) {

				if (option.isSelected && !isInvite) {
					option.isSelected = false;
					newEvent.peeps.remove(option);
				} else if (option.isInvited && isInvite) {
					option.isInvited = false;
					newEvent.peepsInvited.remove(option);
				} else if (isInvite) {
					option.isInvited = true;
					option.inviteTime = Date.now();
					newEvent.peepsInvited.add(option);
					swapOutPeep(option);
				} else {
					option.isSelected = true;
					option.joinTime = Date.now();
					newEvent.peeps.add(option);
					swapOutPeep(option);
				}
			}
		};

		$scope.showMoreOptions = function(stepNum) {
			$scope.loading = true;

			if (stepNum === 2) {
				LocationSrvc.getFoursquareVenues(100, $scope.step.section, $scope.step.category).then(function(result){
					$scope.loading = false;
					$('location-filter').focus();
					$scope.moreOptions = {
						show: true,
						title: 'Where To?',
						options: result.locations
					};
				}, function(error){
					console.log(error);
				});

			} else if (stepNum === 3) {
				$scope.loading = false;
				$('peeps-filter').focus();
				$scope.moreOptions = {
					show: true,
					title: 'With Who?',
					options: allPeeps
				};
			}
		};

		$scope.cancel = function() {
			$location.url('/events');
		};

		$scope.done = function() {
			$scope.loading = true;
			$scope.moreOptions.show = false;
			EventSrvc.saveEvent(newEvent).then(function(eventId){
				$scope.loading = false;
				$location.url('/events');
				incrementUsedPeeps(newEvent.peeps);
				
				sendInvites(newEvent, eventId, existingEvent);

			}, function(error) {
				console.log(error);
			});
		};

		$scope.moreOptionsClose = function() {
			$scope.moreOptions.show = false;
		};

		$scope.dragStart = function(event){
			draggingElm = CircleSrvc.getOrbitCircle(event);
			if (hintTimeout) {
				$timeout.cancel(hintTimeout);
				$scope.step.text = currentText;
			}

			if ($scope.step.num === 3) {
				$scope.peepDragging.status = true;
				$scope.peepDragging.name = this.option.name.firstName;
			}
		};

		$scope.draggingOption = function(event) {
			var translation = 'translate3d(' + event.gesture.deltaX + 'px,' + event.gesture.deltaY + 'px,0)';
			$(draggingElm).css({'transform': translation, '-webkit-transform': translation});
		};

		$scope.maybeSelectOption = function(event, step, option) {
			var xPos = event.gesture.center.pageX;
			var yPos = event.gesture.center.pageY;
			
			if ($scope.step.num === 3 && CircleSrvc.checkWithinPrimaryCircle(xPos, yPos, 'left')) {
				$(draggingElm).animate({width:0, height:0}, 500);
				$scope.selectOption(step, option);
			} else if ($scope.step.num === 3 && CircleSrvc.checkWithinPrimaryCircle(xPos, yPos, 'right')) {
				$(draggingElm).animate({width:0, height:0}, 500);
				$scope.selectOption(step, option, true);
			} else if ( CircleSrvc.checkWithinPrimaryCircle(xPos, yPos) ) {
				$(draggingElm).animate({width:0, height:0}, 500);
				$scope.selectOption(step, option);
      } else {
				var translation = 'translate3d(0,0,0)';
				$('.orbit-circle-content').css({'transform': translation, '-webkit-transform': translation});
      }
      
      // IMPORTANT!!!!!!!!!!!!!
      draggingElm = {};
      $scope.peepDragging = {status: false};
		};

		$scope.hint = function(event) {
			var hintText = 'drag into the circle';
			var elem = $(event.target).closest('.orbit-circle-content');
			currentText = $scope.step.text !== hintText && $scope.step.text || currentText;
			elem.effect('bounce', 500);
			$scope.step.text = 'drag into the circle';
			if (hintTimeout) {
				$timeout.cancel(hintTimeout);
			}
			hintTimeout = $timeout(function(){
				$scope.step.text = currentText;
			}, 1000);
		};

		$scope.getName = function(option) {
			if ($scope.step.num !== 3 && option.name) {
				return option.name.truncate(15, 'right', '...');
			} else if (option.name && option.name.abbName) {
				return option.name.abbName;
			}
		};

		function addCurrentUserToEvent() {
			UserSrvc.getCurrentUser().then(function(user){
				currentUser = user;
				currentUserNumber = user.contactId;
				newEvent.createdBy = user.contactId;
				var userObj = EventSrvc.getUserObjForEvent(user);
				userObj.joinTime = Date.now();
				newEvent.peeps = [ userObj ];
				newEvent.peepsInvited = [];
			}, function(error) {
				console.log(error);
			});
		}

		function processPeeps(peeps) {

			var processedPeeps = [];
			for (var key in peeps) {
				if (peeps.hasOwnProperty(key) && !peeps[key].isDupeOf && peeps[key].firstName) {
					var processedPeep = EventSrvc.getUserObjForEvent(peeps[key], key);
					if (peeps[key].isSelected || peeps[key].isInvited) {
						processedPeep.isSelected = peeps[key].isSelected || false;
						processedPeep.isInvited = peeps[key].isInvited || false;
					}
					processedPeeps.add(processedPeep);
				}
			}

			processedPeeps.each(function(peep){
				PhotoSrvc.getContactPhoto(peep.id).then(function(result){
					if (result) {
						peep.photoUrl = result.src || null;
					}
				});
			});

			processedPeeps.sort(function compare(a,b){
				a.numTimesIncluded = a.numTimesIncluded || 0;
				b.numTimesIncluded = b.numTimesIncluded || 0;

				if (a.numTimesIncluded > b.numTimesIncluded) {
					return -1;
				}
				else if (a.numTimesIncluded < b.numTimesIncluded){
					return 1;
				}
				else {
					return 0;
				}
			});

			return processedPeeps;
		}

		function incrementUsedPeeps(peeps) {
			peeps.each(function(peep){
				ContactSrvc.getContactByPhoneNumber(peep.id).then(function(peepObj){
					if (peepObj) {
						peepObj.numTimesIncluded = peepObj.numTimesIncluded || 0;
						peepObj.numTimesIncluded++;
						ContactSrvc.updateContact(peepObj, peep.id);
					}
				});
			});
		}

		function sendInvites(newEvent, eventId, existingEvent) {
			
			if (currentUser.firstName && currentUser.lastName) {
				var userFullName = currentUser.firstName + ' ' + currentUser.lastName;
				var inviteesText = '';
				
				var inviteMessage = userFullName;
				var notifMessage = userFullName;

				var appUrl = 'petri://event?=' + eventId;
				var webUrl = 'https://petri.firebaseapp.com/#/respond/' + eventId;

				if (newEvent.peeps.length > 1) {
					var num = newEvent.peeps.length;
					newEvent.peeps.each(function(peep, index){
						if (index !== 0) {
							if (num === 2 || num === index + 1) {
								inviteesText += ' and ';
							} else {
								inviteesText += ', ';
							}

							if (peep.name.fullName) {
								inviteesText += peep.name.fullName;
							}
						}
					});
				}

				inviteMessage += inviteesText + ' want you to join';
				notifMessage += inviteesText;

				switch (newEvent.type) {
					case 'Music':
					case 'Drinks':
					case 'Food':
					case 'Dancin\'':
						inviteMessage += ' for some ' + newEvent.type.toLowerCase();
						notifMessage += ' are going out for ' + newEvent.type.toLowerCase();
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

				inviteMessage += ' at ' + newEvent.location.name + '.';
				notifMessage += ' at ' + newEvent.location.name + '.' + ' Check it out: ' + appUrl;

				sortPeepsAndUsers(newEvent.peepsInvited, existingEvent).then(function(sortedPeeps){

					if (sortedPeeps.nonRegInvite && sortedPeeps.nonRegInvite.length) {
						sortedPeeps.nonRegInvite.each(function(peep){
							var nonRegInviteText = inviteMessage + ' Respond here: ' + webUrl + '/' + peep.id;

							ContactSrvc.getAllNumbers(peep, peep.id).then(function(numbers){
								numbers.forEach(function(number){
									PhoneSrvc.sendMessage(number, nonRegInviteText, currentUserNumber);
									LoggingSrvc.addLog('invite', currentUser, nonRegInviteText, false);
									console.log(nonRegInviteText);
								});
							});
						});
					}

					if (sortedPeeps.regInvite && sortedPeeps.regInvite.length) {
						sortedPeeps.regInvite.each(function(peep){
							var regInviteText = inviteMessage + ' Check it out: ' + appUrl;

							ContactSrvc.getAllNumbers(peep, peep.id).then(function(numbers){
								numbers.forEach(function(number){
									PhoneSrvc.sendMessage(number, regInviteText, currentUserNumber);
									LoggingSrvc.addLog('invite', currentUser, regInviteText, false);
									console.log(regInviteText);
								});
							});
						});
					}

					if (!existingEvent) {
						sortedPeeps.reg.each(function(user){
							PhoneSrvc.sendMessage(user.contactId, notifMessage, currentUserNumber);
							console.log(notifMessage);
						});
					}
				});
			}
			
		}

		function swapOutPeep(peep) {
			// warning: can only be used when on the peeps step
			var peepIndex = allPeeps.indexOf(peep);
			$scope.step.options.remove(peep);
			$scope.step.options.add(allPeeps[nextPeepIndex], peepIndex);
			nextPeepIndex++;
		}

		function sortPeepsAndUsers(peepsInvited, existingEvent) {
			var d = $q.defer();
			var nonRegInvite = angular.copy(peepsInvited);
			var regInvite = [];
			var reg = [];

			// if we're augmenting an existing events, only send invites for newly added peeps
			if (existingEvent && existingEvent.peepsInvited && nonRegInvite.length) {
				existingEvent.peepsInvited.each(function (peepInvited) {
					nonRegInvite.each(function(invitee, index){
						if (peepInvited.id === invitee.id) {
							nonRegInvite.splice(index, 1);
						}
					});
				});
			}

			UserSrvc.getRegisteredUsers().then(function(users){
				users.each(function(user){
					var userInvited = false;

					nonRegInvite.each(function(peep, index) {
						if (parseInt(peep.id) === parseInt(user.contactId)) {
							regInvite.push(peep);
							nonRegInvite.splice(index, 1);
						}
					});

					if (!userInvited) {
						reg.push(user);
					}
				});

				var result = {
					nonRegInvite: nonRegInvite,
					regInvite: regInvite,
					reg: reg
				};

				d.resolve(result);
			});

			return d.promise;
		}

	})
;