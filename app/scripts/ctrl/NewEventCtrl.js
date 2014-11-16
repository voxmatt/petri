'use strict';
/* global $ */

angular.module('SupAppIonic')
	.controller('NewEventCtrl', function ($scope, $q, $timeout, EventSrvc, LocationSrvc, $location, ContactSrvc, UserSrvc, PhotoSrvc) {
		var newEvent = {};
		var draggingElm = {};
		var steps = {
			type: {
				num: 1,
				text: 'What\'s on tap?',
				numOrbitCircles: 7,
				options: [
					{name: 'Music', section: 'arts', category: 'music', class:'new-event-music'},
					{name: 'Movie', section: 'arts', category: 'movie', class:'new-event-movie'},
					{name: 'Drinks', section: 'drinks', category: 'drinks', class:'new-event-drinks'},
					{name: 'Food', section: 'food', category: null, class:'new-event-food'},
					{name: 'Dancin\'', section: null, category: 'dancing', class:'new-event-dancing'},
					{name: 'Out doors', section: 'outdoors', category: null, class:'new-event-outdoors'},
					{name: 'Chillin\'', section: null, category: 'chilling', class:'new-event-chillin'}
				],
			},
			location: {
				num: 2,
				text: 'Where to?',
				options: []
			},
			peeps: {
				num: 3,
				text: 'With who?'
			},
			saving: {
				text: 'Saving...',
				options: []
			}
		};

		$scope.loading = false;
		$scope.moreOptions = { show: 'false', title: '', optons: []};
		var allPeeps = {};

		$scope.step = steps.type;
		$scope.selectOption = function(num, option){

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
				newEvent.location = option;
				allPeeps = ContactSrvc.getContactsLocally();
				steps.peeps.options = processPeeps(allPeeps, 10);
				$scope.moreOptions.show = false;
				steps.peeps.numOrbitCircles = steps.peeps.options.length + 1;
				$scope.step = steps.peeps;

			} else if (num === 3) {

				if (option.isSelected) {
					option.isSelected = false;
					newEvent.peeps.remove(option);
				} else {
					option.isSelected = true;
					newEvent.peeps.add(option);
				}
			}
		};

		$scope.showMoreOptions = function(stepNum) {
			if (stepNum === 2) {
				LocationSrvc.getFoursquareVenues(100, $scope.step.section, $scope.step.category).then(function(result){
					$scope.moreOptions = {
						show: true,
						title: 'Where\'s this going down?',
						options: result.locations
					};
				}, function(error){
					console.log(error);
				});

			} else if (stepNum === 3) {
				$scope.moreOptions = {
					show: true,
					title: 'Who\'re you with?',
					options: processPeeps(allPeeps)
				};
			}
		};

		$scope.done = function(stepNum) {
			if (stepNum === 1) {
				$location.url('/events');
			} else {
				$scope.loading = true;
				$scope.moreOptions.show = false;
				EventSrvc.saveEvent(newEvent).then(function(){
					$scope.loading = false;
					$location.url('/events');
					incrementUsedPeeps(newEvent.peeps);
				}, function(error) {
					console.log(error);
				});
			}
		};

		$scope.moreOptionsClose = function() {
			$scope.moreOptions.show = false;
		};

		$scope.setInitialPosition = function(event){
			draggingElm = getOrbitCircle(event);
		};

		$scope.draggingOption = function(event) {
			var translation = 'translate3d(' + event.gesture.deltaX + 'px,' + event.gesture.deltaY + 'px,0)';
			$(draggingElm).css({'transform': translation, '-webkit-transform': translation});
		};

		$scope.maybeSelectOption = function(event, step, option) {
			var xPos = event.gesture.center.pageX;
			var yPos = event.gesture.center.pageY;
      if ( checkWithinPrimaryCircle(xPos, yPos) ) {
				$(draggingElm).animate({width:0, height:0}, 500);
				$scope.selectOption(step, option);
      } else {
				var translation = 'translate3d(0,0,0)';
				$(draggingElm).css({'transform': translation, '-webkit-transform': translation});
      }
      // IMPORTANT!!!!!!!!!!!!!
      draggingElm = {};
		};

		$scope.hint = function(event) {
			var text = $scope.step.text;
			var elem = $(event.target).closest('.orbit-circle-content');
			elem.effect('bounce', 500);
			$scope.step.text = 'drag into the circle';
			$timeout(function(){
				$scope.step.text = text;
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
				newEvent.createdBy = user.contactId;
				newEvent.peeps = [ EventSrvc.getUserObjForEvent(user) ];
			}, function(error) {
				console.log(error);
			});
		}

		function processPeeps(peeps, limit) {

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

			if (limit && processedPeeps.length > limit) {
				var sortedPeeps = processedPeeps.sortBy(function(peep){
					return peep.numTimesIncluded;
				}, true);
				return sortedPeeps.to(limit - 1);
			}
			else {
				var sortedPeepsWithLimit = processedPeeps.sortBy(function(peep){
					return peep.name.firstName;
				});
				return sortedPeepsWithLimit;
			}
		}

		function incrementUsedPeeps(peeps) {

			peeps.each(function(peep){
				if (allPeeps[peep.id]){
					if (allPeeps[peep.id].numTimesIncluded) {
						allPeeps[peep.id].numTimesIncluded = Number(allPeeps[peep.id].numTimesIncluded) + 1;
					} else {
						allPeeps[peep.id].numTimesIncluded = 1;
					}
				}
			});

			ContactSrvc.bulkUpdateContacts(allPeeps);
		}

		function getOrbitCircle(event) {
			var orbitElem = event.target;
			var i = 0;

			while (!$(orbitElem).hasClass('orbit-circle-content') && i < 4) {
				orbitElem = orbitElem.parentElement;
				i++;
			}

			return orbitElem;
		}

		function checkWithinPrimaryCircle(xPos, yPos) {
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
				return true;
			} else {
				return false;
			}
		}
	})
;