'use strict';
/* global Firebase */

angular.module('SupAppIonic')
	.factory('UserSrvc', function($q) {

		var myRef = new Firebase('https://sup-test.firebaseio.com/users');
		var currentUserId = '';

		function setCurrentUserId(userId) {
			currentUserId = userId;
		}

		function getCurrentUserId() {
			return currentUserId;
		}

		function getUser(userId) {
			var deferred = $q.defer();

			myRef.child(userId).on('value', function(snapshot) {
				if (snapshot) {
					deferred.resolve(snapshot.val());
				} else {
					deferred.reject('No user with that id');
				}
			});

			return deferred.promise;
		}

		function saveUserData(userId, data){
			var deferred = $q.defer();

			myRef.child(userId).update(data, function(error){
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve('Data saved');
				}
			});

			return deferred.promise;
		}

		function getCurrentUser() {
			return getUser(currentUserId);
		}

		function saveCurrentUserData(dataObj) {
			return saveUserData(currentUserId, dataObj);
		}

		return {
			setCurrentUserId: setCurrentUserId,
			getCurrentUserId: getCurrentUserId,
			getUser: getUser,
			saveUserData: saveUserData,
			getCurrentUser: getCurrentUser,
			saveCurrentUserData: saveCurrentUserData
		};
	})
;