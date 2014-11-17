'use strict';
/* global $ */

angular.module('SupAppIonic')
	.controller('NewEventCtrl', function ($scope, $q, $timeout, EventSrvc, LocationSrvc, $location, ContactSrvc, UserSrvc, PhotoSrvc, PhoneSrvc) {
		
		var newEvent, draggingElm, hintTimeout, currentText, allPeeps, steps, nextPeepIndex, currentUser;

		(function init() {
			newEvent = {};
			draggingElm = {};
			hintTimeout = null;
			currentText = '';
			allPeeps = {};
			currentUser = {};
			steps = {
				type: {
					key: 'type',
					num: 1,
					text: 'What\'s on tap?',
					numOrbitCircles: 7,
					options: [
						{name: 'Music', section: 'arts', category: 'music', class:'event-music'},
						{name: 'Movie', section: 'arts', category: 'movie', class:'event-movie'},
						{name: 'Drinks', section: 'drinks', category: 'drinks', class:'event-drinks'},
						{name: 'Food', section: 'food', category: null, class:'event-food'},
						{name: 'Dancin\'', section: null, category: 'dancing', class:'event-dancing'},
						{name: 'Out doors', section: 'outdoors', category: null, class:'event-outdoors'},
						{name: 'Chillin\'', section: null, category: 'chilling', class:'event-chillin'}
					],
				},
				location: {
					key: 'location',
					num: 2,
					text: 'Where to?',
					options: []
				},
				peeps: {
					key: 'peeps',
					num: 3,
					text: 'With who?'
				},
				saving: {
					key: 'saving',
					text: 'Saving...',
					options: []
				}
			};

			$scope.loading = false;
			$scope.moreOptions = { show: 'false', title: '', optons: []};
			$scope.peepDragging = {status: false};
			$scope.step = steps.type;
		})();

		$scope.selectOption = function(num, option, isInvite){

			if (num === 1){
				newEvent.type = option.name;
				$scope.loading = true;

				LocationSrvc.getFoursquareVenues(10, option.section, option.category).then(function(result){
					steps.location.options = result.locations;
					steps.location.section = option.section;
					steps.location.category = option.category;
					$scope.moreOptions.show = false;
					steps.location.numOrbitCircles = steps.location.options.length + 1;
					$scope.step = steps.location;
				}, function(error){
					console.log(error);
				}).finally(function(){
					$scope.loading = false;
				});

				addCurrentUserToEvent();

			} else if (num === 2){
				$scope.loading = true;
				newEvent.location = option;

				ContactSrvc.getContacts().then(function(contacts){
					allPeeps = processPeeps(contacts);
					steps.peeps.options = allPeeps.slice(0,9);
					nextPeepIndex = 10;
					$scope.moreOptions.show = false;
					steps.peeps.numOrbitCircles = steps.peeps.options.length + 1;
					$scope.step = steps.peeps;
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
			EventSrvc.saveEvent(newEvent).then(function(){
				$scope.loading = false;
				$location.url('/events');
				incrementUsedPeeps(newEvent.peeps);
				sendInvites(newEvent);
			}, function(error) {
				console.log(error);
			});
		};

		$scope.moreOptionsClose = function() {
			$scope.moreOptions.show = false;
		};

		$scope.dragStart = function(event){
			draggingElm = getOrbitCircle(event);
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
			
			if ($scope.step.num === 3 && checkWithinPrimaryCircle(xPos, yPos, 'left')) {
				$(draggingElm).animate({width:0, height:0}, 500);
				$scope.selectOption(step, option);
			} else if ($scope.step.num === 3 && checkWithinPrimaryCircle(xPos, yPos, 'right')) {
				$(draggingElm).animate({width:0, height:0}, 500);
				$scope.selectOption(step, option, true);
			} else if ( checkWithinPrimaryCircle(xPos, yPos) ) {
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
					processedPeeps.add(EventSrvc.getUserObjForEvent(peeps[key], key));
				}
			}

			processedPeeps.each(function(peep){
				PhotoSrvc.getContactPhoto(peep.id).then(function(result){
					if (result) {
						peep.photoUrl = result.src || null;
					}
				});
			});

			var sortedPeeps = processedPeeps.sortBy(function(peep){
				if (peep.userId) {
					return true;
				} else {
					return peep.name.firstName;
				}
			});

			return sortedPeeps;
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

		function sendInvites(newEvent) {
			if (newEvent.peepsInvited.length && currentUser.firstName && currentUser.lastName) {
				var message = currentUser.firstName + ' ' + currentUser.lastName + ' wants to know if you want to join him'; 

				if (newEvent.peeps.length > 1) {
					var num = newEvent.peeps.length;
					newEvent.peeps.each(function(peep, index){
						if (index !== 0) {
							if (num === 2 || num === index + 1) {
								message += ' and ';
							} else {
								message += ', ';
							}

							if (peep.name.fullName) {
								message += peep.name.fullName;
							}
						}
					});
				}

				switch (newEvent.type) {
					case 'Music':
					case 'Drinks':
					case 'Food':
					case 'Dancin\'':
						message += ' for some ' + newEvent.type.toLowerCase();
						break;
					case 'Movie':
						message += ' for a movie';
						break;
					case 'Out doors':
						message += ' to hang outdoors';
						break;
					case 'Chillin\'':
						message += ' to hang out';
						break;
				}

				message += ' at ' + newEvent.location.name + '.';

				console.log(message);

				newEvent.peepsInvited.each(function(peep){
					PhoneSrvc.sendMessage(peep.id, message);
				});
			}
			
		}

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

		function swapOutPeep(peep) {
			// warning: can only be used when on the peeps step
			var peepIndex = allPeeps.indexOf(peep);
			$scope.step.options.remove(peep);
			$scope.step.options.add(allPeeps[nextPeepIndex], peepIndex);
			nextPeepIndex++;
		}
	})
;