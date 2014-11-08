'use strict';
/* global Firebase */

angular.module('SupAppIonic')
	.factory('UserSrvc', function($q, $rootScope) {

		/////////////////////////////////
		// Manage User in LocalStorage //
		/////////////////////////////////
		var currentUser = {};
		var myRef = new Firebase('https://petri.firebaseio.com/users');
		
		$rootScope.$on('$firebaseSimpleLogin:login', function(event, user) {
			getUser(user.id).then(function(user){
				setLocalStorageUser(user);
				currentUser = user;

				$rootScope.$broadcast('userDefined', user);
			});
		});

		$rootScope.$on('$firebaseSimpleLogin:logout', function() {
			currentUser = null;
			setLocalStorageUser({});
		});

		function setLocalStorageUser(user) {
			window.localStorage.currentUser = JSON.stringify(user);
		}

		function setCurrentUserId(userId) {
			currentUser.id = userId;
			setLocalStorageUser(currentUser);
		}

		function getCurrentUserId() {
			return currentUser.id;
		}

		function getCurrentUser() {
			if (currentUser.contactId) {
				return $q.when(currentUser);
			}
			return getUser(currentUser.id);
		}

		function getUser(userId) {
			var deferred = $q.defer();

			myRef.child(userId).on('value', function(snapshot) {
				if (snapshot) {
					if (currentUser && userId === currentUser.contactId) {
						setLocalStorageUser(snapshot.val());
					}
					deferred.resolve(snapshot.val());
				} else {
					deferred.reject('No user with that id');
				}
			});

			return deferred.promise;
		}

		function saveUserData(userId, data){
			var deferred = $q.defer();
			setLocalStorageUser(data);

			myRef.child(userId).update(data, function(error){
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve('Data saved');
				}
			});

			return deferred.promise;
		}

		function userOnRegistrationStep(stepName) {
			var d = $q.defer();

			saveUserData(currentUser.id, {regStep: stepName}).then(function(success){
				d.resolve(success);
			}, function(error){
				d.reject(error);
			});

			return d.promise;
		}

		function getRegistrationStatus() {
			var d = $q.defer();

			getCurrentUser().then(function(user){
				if (user.registered) {
					d.resolve(true);
				} else {
					var status = user.regStep || null;
					d.resolve(status);
				}
			}, function(error){
				d.reject(error);
			});

			return d.promise;
		}

		function userRegistrationComplete(){
			var d = $q.defer();

			saveUserData(currentUser.id, {registered: true}).then(function(){
				updateUserLocally({registered: true}, currentUser.id);
				myRef.child(currentUser.id).child('regStep').remove(function(error){
					if (error) {
						d.reject(error);
					} else {
						d.resolve('Registration Complete!');
					}
				});

			}, function(error){
				d.reject(error);
			});

			return d.promise;
		}

		function saveCurrentUserData(dataObj) {
			dataObj.id = currentUser.id;
			updateUserLocally(dataObj);
			return saveUserData(currentUser.id, dataObj);
		}

		function updateUserLocally(user) {
			var userData = getUserLocally();
			userData.id = currentUser.id;
			Object.merge(userData, user);
			window.localStorage.user = JSON.stringify(userData);
		}

		function getUserLocally() {
			return JSON.parse(window.localStorage.user || '{}');
		}

		return {
			currentUser: currentUser,
			setCurrentUserId: setCurrentUserId,
			getCurrentUserId: getCurrentUserId,
			getCurrentUser: getCurrentUser,
			getUser: getUser,
			saveUserData: saveUserData,
			getRegistrationStatus: getRegistrationStatus,
			userOnRegistrationStep: userOnRegistrationStep,
			userRegistrationComplete: userRegistrationComplete,
			saveCurrentUserData: saveCurrentUserData,
			updateUserLocally: updateUserLocally,
			getUserLocally: getUserLocally
		};
	})
;