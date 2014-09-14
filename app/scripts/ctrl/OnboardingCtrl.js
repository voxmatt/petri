'use strict';
/* global Firebase */

angular.module('SupAppIonic')
	.controller('OnboardingCtrl', function ($scope, $rootScope, $location, $firebaseSimpleLogin, UserSrvc, ContactSrvc, PhoneSrvc) {
		
		var userNumber = '';
		var steps = [
			{ num: 0, title: 'Verify Phone #' },
			{ num: 1, title: 'Find Friends' },
			{ num: 2, title: 'Complete Profile' }
		];

		$scope.step = steps[0];
		$scope.confirmCode = {loading: false, sent: false, code: null, error: null};

		$scope.currentUser = {};

		var dataRef = new Firebase('https://sup-test.firebaseio.com');
    $scope.loginObj = $firebaseSimpleLogin(dataRef);

		$scope.user = $scope.loginObj.$getCurrentUser();

		$scope.validTel = function(number){
			var validObj = PhoneSrvc.numberValidator(number);
			return validObj.isValid;
		};

		$scope.sendConfirm = function(number){
			var validObj = PhoneSrvc.numberValidator(number);
			var	userNumber = validObj.number;
			$scope.confirmCode.loading = true;
			PhoneSrvc.sendNumberConfirm(userNumber).then(function(result){
				$scope.confirmCode.sent = true;
				$scope.confirmCode.loading = false;
				$scope.confirmCode.code = result;
			}, function(){
				$scope.confirmCode.loading = false;
				$scope.confirmCode.error = 'Sorry, there was an error sending your confirmation code. Please try again.';
			});
		};

		$scope.addTel = function(code, number) {
			if (Number(code) === Number($scope.confirmCode.code)) {
				var validObj = PhoneSrvc.numberValidator(number);
				userNumber = validObj.number;
				ContactSrvc.globalNumberVerified(userNumber);
				UserSrvc.saveCurrentUserData({contactId: userNumber}).then(function(){
					$scope.step = steps[1];
				}, function(error){
					console.log(error);
				});
			} else {
				$scope.confirmCode.error = 'Sorry, that code doesn\'t match what we sent. Please try again.';
			}

		};

		$scope.addContacts = function() {

			$scope.loading = true;
			ContactSrvc.updateUserContactsFromLocal().then(function(){
				
				UserSrvc.getCurrentUser().then(function(user) {
					$scope.currentUser = user;
				}, function(error) {
					console.log(error);
				});
				$scope.loading = false;
				$scope.step = steps[2];
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
			}, function(error) {
				console.log(error);
			});
		};

	})
;