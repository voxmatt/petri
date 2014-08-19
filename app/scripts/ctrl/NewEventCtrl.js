'use strict';

angular.module('SupAppIonic')
	.controller('NewEventCtrl', function ($scope, $q, EventSrvc, LocationSrvc, $location, ContactSrvc, UserSrvc) {
		var newEvent = {};
		var steps = {
			type: {
				num: 1,
				text: 'What\'re you thinking?',
				options: [
					{name: 'Music', section: null},
					{name: 'Movie', section: null},
					{name: 'Drinks', section: 'drinks'},
					{name: 'Food', section: 'food'},
					{name: 'Dancing', section: null},
					{name: 'Out doors', section: 'outdoors'},
					{name: 'Chillin\'', section: null}
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
			loading: {
				text: 'Loading...',
				options: []
			},
			saving: {
				text: 'Saving...',
				options: []
			}
		};
		var allPeeps = {};

		$scope.step = steps.type;
		$scope.selectOption = function(num, option){

			if (num === 1){
				newEvent.type = option.name;
				var getPhotos = true;

				$scope.step = steps.loading;

				LocationSrvc.getFoursquareVenues(10, option.section, getPhotos, true, false).then(function(result){
					steps.location.options = processLocations(result.response.groups[0].items, getPhotos);
					$scope.step = steps.location;
				}, function(error){
					console.log(error);
				});

				addCurrentUserToEvent();

			} else if (num === 2){
				newEvent.location = option;

				$scope.step = steps.loading;

				ContactSrvc.getUserContacts().then(function(result){
					allPeeps = result;
					steps.peeps.options = processPeeps(allPeeps, true, 10);
					$scope.step = steps.peeps;
				}, function(error){
					console.log(error);
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
				LocationSrvc.getFoursquareVenues(100, null, getPhotos, true, false).then(function(result){
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

				EventSrvc.saveEvent(newEvent).then(function(){
					$location.url('/events');
				}, function(error) {
					console.log(error);
				});
			}
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