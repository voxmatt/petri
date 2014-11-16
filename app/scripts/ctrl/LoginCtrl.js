'use strict';
/* global Firebase */

angular.module('SupAppIonic')
	.controller('LoginCtrl', function($scope, $rootScope, $location, $firebase, $firebaseSimpleLogin, UserSrvc) {

		// Get a reference to the Firebase
		var firebaseRef = new Firebase('https://petri.firebaseio.com/');

		// Create a Firebase Simple Login object
		$scope.auth = $firebaseSimpleLogin(firebaseRef);
		
		// Initially set no user to be logged in
		$scope.user = null;

		$scope.passwordReset = {};

		// Logs a user in with inputted provider
		$scope.login = function() {

			$scope.auth.$login('password', {
				email: $scope.login.email,
				password: $scope.login.password,
				rememberMe: true
			}).then(function(){
				$location.path('/onboarding');
			}, function(error) {
				showError(error);
			});

		};

		$scope.createUser = function() {
			var email = $scope.login.email;
			var password = $scope.login.password;

			$scope.auth.$createUser(email, password).then(function(user) {

				// the above creates a user for login purposes, now let's create a record for reference
				var saveData = {
					email: user.email,
					provider: user.provider,
					id: user.id
				};
				UserSrvc.saveUserData(user.id, saveData).then(function(success){
					console.log(success);
				}, function(error){
					console.log(error);
				});

				// creating a user doesn't log them in, so log in after success
				$scope.auth.$login('password', {
					email: email,
					password: password,
					rememberMe: true
				}).then(function() {
					$location.path('/onboarding');
				}, function(error) {
					showError(error);
				});


			}, function(error) {
				showError(error);
			});

		};

		// Logs a user out
		$scope.logout = function() {
			$scope.auth.$logout();
		};

		$scope.sendPasswordReset = function() {
			$scope.auth.$sendPasswordResetEmail($scope.login.email).then(function() {
				$scope.passwordReset.success = true;
			});
		};

		// Upon successful login, set the user object
		$rootScope.$on('$firebaseSimpleLogin:login', function(event, user) {
			$scope.user = user;
		});

		// Upon successful logout, reset the user object
		$rootScope.$on('$firebaseSimpleLogin:logout', function() {
			$scope.user = null;
			$location.path('/login');

			window.cookies.clear(function() {
				console.log('Cookies cleared!');
			});
		});

		// Log any login-related errors to the console
		$rootScope.$on('$firebaseSimpleLogin:error', function(event, error) {
			console.log('Error logging user in: ', error);
		});

		function showError(error){
			if (error.code === 'INVALID_USER') {
				$scope.loginError = 'Sorry, but there is no user with that email address.';
			} else if (error.code === 'INVALID_PASSWORD') {
				$scope.loginError = 'Wrong password.';
				$scope.passwordReset.show = true;
			} else if (error.code === 'EMAIL_TAKEN') {
				$scope.loginError = 'Sorry, but this email address is already in use.';
			}
		}

	})
;