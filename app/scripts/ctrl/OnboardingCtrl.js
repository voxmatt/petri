'use strict';
/* global Firebase */

angular.module('SupAppIonic')
	.controller('OnboardingCtrl', function ($scope, $rootScope, $location, $firebaseSimpleLogin, UserSrvc, ContactSrvc, PhoneSrvc) {
		
		var	userNumber;
		var steps = [
			{ num: 0, title: 'Launching' },
			{ num: 1, title: 'Verify Phone #' },
			{ num: 2, title: 'Verify Phone #' },
			{ num: 3, title: 'Find Friends' },
			{ num: 4, title: 'Complete Profile' }
		];

		$scope.step = steps[0];
		$scope.confirmCode = {loading: false, sent: false, code: null, error: null};
		$scope.currentUser = {};

		// LAME WAY TO INIT THE APP HERE
		UserSrvc.getRegistrationStatus().then(function(status){
			if(status === true) {
				$location.url('/events');
			} else if (status === 'addTel') {
				$scope.step = steps[1];
			} else if (status === 'addContacts') {
				$scope.step = steps[3];
			} else if ($scope.status === 'saveName') {
				$scope.step = steps[4];
			} else {
				$scope.step = steps[1];
			}
		}, function(error){
			console.log(error);
		});

		var dataRef = new Firebase('https://sup-test.firebaseio.com');
    $scope.loginObj = $firebaseSimpleLogin(dataRef);

		$scope.user = $scope.loginObj.$getCurrentUser();

		$scope.goToStep = function (stepNum) {
			$scope.step = steps[stepNum];
		};

		$scope.validTel = function(number){
			var validObj = PhoneSrvc.numberValidator(number);
			return validObj.isValid;
		};

		$scope.sendConfirm = function(number){
			var validObj = PhoneSrvc.numberValidator(number);
			userNumber = validObj.number;
			$scope.confirmCode.loading = true;
			PhoneSrvc.sendNumberConfirm(userNumber).then(function(result){
				$scope.confirmCode.sent = true;
				$scope.confirmCode.loading = false;
				$scope.confirmCode.code = result;
				$scope.step = steps[2];
				UserSrvc.userOnRegistrationStep('addTel');
			}, function(){
				$scope.confirmCode.loading = false;
				$scope.confirmCode.error = 'Sorry, there was an error sending your confirmation code. Please try again.';
			});
		};

		$scope.addTel = function(code) {
			if (Number(code) === Number($scope.confirmCode.code)) {
				
				ContactSrvc.globalNumberVerified(userNumber);

				UserSrvc.saveCurrentUserData({contactId: userNumber}).then(function(){
					$scope.step = steps[3];
					UserSrvc.userOnRegistrationStep('addContacts');
				}, function(error){
					console.log(error);
				});
			} else {
				$scope.confirmCode.error = 'Sorry, that code doesn\'t match what we sent. Please try again.';
			}
		};

		$scope.addContacts = function() {

			$scope.step = steps[0];
			$scope.step.title = 'Updating Friends';
			var time = Date.now();
			userNumber = userNumber || UserSrvc.currentUser.contactId;

			ContactSrvc.updateUserContactsFromLocal(userNumber).then(function(){
				
				UserSrvc.getCurrentUser().then(function(user) {
					$scope.currentUser = user;
				}, function(error) {
					console.log(error);
				});
				
				$scope.loading = false;
				$scope.step = steps[4];
				$scope.step.title = Date.now() - time;
				UserSrvc.userOnRegistrationStep('saveName');
			}, function(error){
				console.log(error);
			});
		};

		$scope.saveName = function() {
			var saveData = {
				firstName: $scope.currentUser.firstName,
				lastName: $scope.currentUser.lastName
			};

			UserSrvc.saveUserData($scope.currentUser.id, saveData).then(function(){
				$location.url('/events');
				UserSrvc.userRegistrationComplete();
			}, function(error) {
				console.log(error);
			});
		};
	})
;