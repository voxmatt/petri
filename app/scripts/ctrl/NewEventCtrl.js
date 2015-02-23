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
		currentUser, currentUserNumber, editingEvent, registeredNumbers, peepsAdding, peepsInviting;

		function reset() {
			draggingElm = {};
			hintTimeout = null;
			currentText = '';
			allPeeps = {};
			currentUser = {};
			currentUserNumber = null;
			editingEvent = false;
			steps = EventCnst.STEPS;
			$scope.loading = false;
			$scope.moreOptions = { show: false, title: '', optons: []};
			$scope.peepDragging = {status: false};

			registeredNumbers = [];
			peepsAdding = [];
			peepsInviting = [];
		}

		(function init() {

			reset();
			newEvent = StateSrvc.getEditingEvent();

			if (newEvent && newEvent.location) {
				$scope.step = steps.PEEPS;
				$scope.loading = true;
				editingEvent = true;

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
					LoggingSrvc.addLog('new event', null, 'failed to get contacts', true);
				}).finally(function(){
					$scope.loading = false;
				});
			} else {
				newEvent = {};
				$scope.step = steps.TYPE;
			}

			// make sure we have the current user
			UserSrvc.getCurrentUser().then(function(user){
				currentUser = user;
				currentUserNumber = user.contactId;
			}, function() {
				LoggingSrvc.addLog('new event', currentUser, 'failed to get current user', true);
			});

			// get the numbers for registered users, we'll need them
			UserSrvc.getAllUserNumbers().then(function(numbersArray){
				registeredNumbers = numbersArray;
			});

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
				}, function(){
					LoggingSrvc.addLog('new event', currentUser, 'failed to get location', true);
				}).finally(function(){
					$scope.loading = false;
				});

				addCurrentUserToEvent(newEvent);

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
					LoggingSrvc.addLog('new event', currentUser, 'failed to get contacts', true);
				}).finally(function(){
					$scope.loading = false;
				});
				
			} else if (num === 3) {

				if (option.isSelected && !isInvite) {
				
					// if the peep is already selected, and this isn't an invite click
					// then they're being removed from the event
					removePeepFromEvent(newEvent, option);
				
				} else if (option.isInvited && isInvite) {
					
					// if the peep is already invited, and this is an invite clcik
					// then they're being removed from the invite list
					removePeepFromInvited(newEvent, option);

				} else if (isInvite) {
				
					// if the peep is neither invited, nor selected and this is an invite click
					// then they're being invited
					addPeepToInvited(newEvent, option);
					option.isInvited = true;
				
				} else {
				
					// otherwise, they're being added to the event
					addPeepToEvent(newEvent, option);
				
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
				}, function(){
					LoggingSrvc.addLog('new event', currentUser, 'failed to get location', true);
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

			markRegisteredPeeps(peepsAdding, peepsInviting);

			EventSrvc.saveEvent(newEvent).then(function(eventId){
				$scope.loading = false;
				$location.url('/events');
				incrementUsedPeeps(newEvent.peeps);
				
				EventSrvc.sendInvites(newEvent, eventId, editingEvent, peepsAdding, peepsInviting, currentUser, registeredNumbers);

			}, function() {
				LoggingSrvc.addLog('new event', currentUser, 'failed to save event', true);
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

		function removePeepFromEvent(event, peep) {
			peep.isSelected = false;
			event.peeps.remove(peep);

			if (peepsAdding.indexOf(peep) !== -1) {
				peepsAdding.splice(peep, 1);
			}
		}

		function addPeepToEvent(event, peep) {
			peep.isSelected = true;
			peep.joinTime = Date.now();
			peep.addedBy = currentUser.contactId;
			event.peeps.add(peep);
			peepsAdding.push(peep);
			swapOutPeep(peep);

			ContactSrvc.getAllNumbers(peep, peep.id).then(function(numbers){
				peep.numbers = numbers;
			});
		}

		function removePeepFromInvited(event, peep) {
			peep.isInvited = false;
			event.peepsInvited.remove(peep);

			if (peepsInviting.indexOf(peep) !== -1) {
				peepsInviting.splice(peep, 1);
			}
		}

		function addPeepToInvited(event, peep) {
			peep.isInvited = true;
			peep.inviteTime = Date.now();
			peep.invitedBy = currentUser.contactId;
			event.peepsInvited.add(peep);
			peepsInviting.push(peep);
			swapOutPeep(peep);

			ContactSrvc.getAllNumbers(peep, peep.id).then(function(numbers){
				peep.numbers = numbers;
			});
		}

		function addCurrentUserToEvent(event) {
			var userObj = EventSrvc.getUserObjForEvent(currentUser);
			userObj.joinTime = Date.now();
			userObj.numbers = [ currentUser.contactId ];
			userObj.registered = true;
			event.createdBy = currentUser.contactId;
			event.peeps = [ userObj ];
			event.peepsInvited = [];
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
				ContactSrvc.incrementContactUsedCount(peep);
			});
		}

		function swapOutPeep(peep) {
			// warning: can only be used when on the peeps step
			var peepIndex = allPeeps.indexOf(peep);
			$scope.step.options.remove(peep);
			$scope.step.options.add(allPeeps[nextPeepIndex], peepIndex);
			nextPeepIndex++;
		}

		function markRegisteredPeeps(added, invited) {

			var peeps = added.concat(invited);

			peeps.forEach(function(peep){

				if (peep.registered) {
					return;
				}

				peep.numbers.forEach(function(number){
					if (registeredNumbers.indexOf(parseInt(number)) !== -1 ) {
						peep.registered = true;
					}
				});
			});
		}
	})
;