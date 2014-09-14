'use strict';

angular.module('SupAppIonic')
	.controller('NewEventCtrl', function ($scope, $q, EventSrvc, LocationSrvc, $location, ContactSrvc, UserSrvc, PhotoSrvc) {
		var newEvent = {};
		var steps = {
			type: {
				num: 1,
				text: 'What\'re you thinking?',
				numOrbitCircles: 7,
				options: [
					{name: 'Music', section: null, class:'new-event-music'},
					{name: 'Movie', section: null, class:'new-event-movie'},
					{name: 'Drinks', section: 'drinks', class:'new-event-drinks'},
					{name: 'Food', section: 'food', class:'new-event-food'},
					{name: 'Dancing', section: null, class:'new-event-dancing'},
					{name: 'Out doors', section: 'outdoors', class:'new-event-outdoors'},
					{name: 'Chillin\'', section: null, class:'new-event-chillin'}
				],
			},
			location: {
				num: 2,
				text: 'Where\'s this going down?',
				options: []
			},
			peeps: {
				num: 3,
				text: 'Who\'re you with?'
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
				var getPhotos = true;

				$scope.loading = true;

				LocationSrvc.getFoursquareVenues(10, option.section, getPhotos, true, true).then(function(result){
					steps.location.options = processLocations(result.response.groups[0].items, getPhotos);
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

				$scope.loading = true;

				ContactSrvc.getUserContacts().then(function(result){
					allPeeps = result;
					steps.peeps.options = processPeeps(allPeeps, true, 10);
					$scope.moreOptions.show = false;
					steps.peeps.numOrbitCircles = steps.peeps.options.length + 1;
					$scope.step = steps.peeps;
				}, function(error){
					console.log(error);
				}).finally(function(){
					$scope.loading = false;
				});

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
				var getPhotos = true;
				LocationSrvc.getFoursquareVenues(100, null, getPhotos, true, true).then(function(result){
					var locations = processLocations(result.response.groups[0].items, getPhotos);
					$scope.moreOptions = {
						show: true,
						title: 'Where\'s this going down?',
						options: locations
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

		$scope.addPeep = function(){
			var numOpts = $scope.step.options.length;
			if ($scope.step.options[numOpts - 1].name !== '' && $scope.step.options[numOpts - 1].name.length === 1){
				$scope.step.options.push({name:''});
			}
		};

		$scope.done = function(stepNum) {
			if (stepNum === 1) {
				$location.url('/events');
			} else {
				$scope.moreOptions.show = false;
				EventSrvc.saveEvent(newEvent).then(function(){
					$location.url('/events');
				}, function(error) {
					console.log(error);
				});
			}
		};

		$scope.moreOptionsClose = function() {
			$scope.moreOptions.show = false;
		};

		$scope.upload = function(fileUrl) {
			console.log( ContactSrvc.getBase64Image(fileUrl) );
		};

		function addCurrentUserToEvent() {
			UserSrvc.getCurrentUser().then(function(user){
				newEvent.createdBy = user.contactId;
				var peepObj = {id: user.contactId, name: user.firstName};
				if (user.lastName) {
					peepObj.name += ' ' + user.lastName[0] + '.';
				}
				newEvent.peeps = [peepObj];
			}, function(error) {
				console.log(error);
			});
		}

		function processLocations(locations, getPhotos){
			var processedLocations = [];

			locations.each(function(loc){
				var locOption = {
					name: loc.venue.name.truncate(15, 'right', ''),
					categories: loc.venue.categories || null,
					hours: loc.venue.hours.status || null,
					photoUrl: getPhotos && LocationSrvc.getFoursqaurePhotoUrl(loc.venue, 'small'),
					price: loc.venue.price || null,
					rating: loc.venue.rating || null,
					id: loc.venue.id,
					location: loc.venue.location || null
				};
				if (locOption.location && locOption.location.distance) {
					var distObj = LocationSrvc.getStaticDistanceAway(locOption.location.distance);
					locOption.tempDistAway = distObj.display;
				}
				processedLocations.push(locOption);
			});

			return processedLocations;
		}

		function processPeeps(peeps, abbreviateLastName, limit) {

			var processedPeeps = [];
			for (var key in peeps) {
				if (peeps.hasOwnProperty(key) && !peeps[key].isDupeOf && peeps[key].firstName) {
					var arrayObj = { id: key, name: peeps[key].firstName };
					
					if (peeps[key].lastName && abbreviateLastName) {
						arrayObj.name += ' ' + peeps[key].lastName[0] + '.';
					} else if (peeps[key].lastName) {
						arrayObj.name += ' ' + peeps[key].lastName;
					}
					
					processedPeeps.add(arrayObj);
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
				return processedPeeps.to(limit - 1);
			}
			else {
				var sortedPeeps = processedPeeps.sortBy(function(peep){
					return peep.name;
				});
				return sortedPeeps;
			}
		}
	})
;