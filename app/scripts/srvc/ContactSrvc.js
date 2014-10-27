'use strict';
/* global ContactFindOptions, Firebase */

// TERMINOLOGY
// local contact = on the user's device
// user contact = a contact in the user's addressBook in the app
// global contact = a shell record of phone numbers the app keeps to cross-reference between users and contacts

angular.module('SupAppIonic')

	.factory('ContactSrvc', function($q, $firebase, DebuggingData, PhoneSrvc, UserSrvc, PhotoSrvc) {

		  /////////////////////////
		 // User Contacts Stuff //
		/////////////////////////

		var userContactsRef = new Firebase('https://sup-test.firebaseio.com/userContacts');

		function getLocalContacts() {
			// get's the contacts off the user's device

			var deferred = $q.defer();

			if (window.cordova){

				// if we're native, do the native contact stuff
				var options = new ContactFindOptions();
				options.multiple = true;
				options.desiredFields = ['name','phoneNumbers', 'photos'];
				var fields = ['*'];

				navigator.contacts.find(fields, function(contacts) {
					deferred.resolve(contacts);
				}, function(error) {
					deferred.reject(error);
				}, options);

			} else {
				// otherwise, return something for debugging
				deferred.resolve(DebuggingData.addressbook);
			}

			return deferred.promise;
		}

		function uploadAllLocalContacts() {
			var rawContactsRef = new Firebase('https://sup-test.firebaseio.com/rawContacts');

			var d = $q.defer();

			if (window.cordova){

				// if we're native, do the native contact stuff
				var options = new ContactFindOptions();
				options.multiple = true;
				options.desiredFields = ['name','phoneNumbers', 'photos'];
				var fields = ['*'];
				var time = Date.now();

				navigator.contacts.find(fields, function(contacts) {

					d.resolve(Date.now() - time);
					rawContactsRef.update(contacts);
				}, function() {
				}, options);

				return d.promise;
			}
		}

		function getUserContacts(){
			var deferred = $q.defer();

			UserSrvc.getCurrentUser().then(function(user){
				userContactsRef.child(user.contactId).on('value', function(snapshot) {
					if (snapshot) {
						var contacts = snapshot.val();
						deferred.resolve(contacts);
					} else {
						deferred.reject('Could not find user contacts');
					}
				});
			}, function(error) {
				deferred.reject(error);
			});

			return deferred.promise;
		}


		function updateCurrentUserContacts(data) {
			var d = $q.defer();

			UserSrvc.getCurrentUser().then(function(user){
				userContactsRef.child(user.contactId).update(data, function(error){
					if (error) {
						d.reject(error);
					} else {
						d.resolve('Updated User Contacts');
					}
				});
			}, function (error){
				d.reject(error);
			});

			return d.resolve;
		}

		// this function does a metric fuck-ton...
		function updateUserContactsFromLocal(userPhoneNumber){

			var deferred = $q.defer();
			var userId = UserSrvc.getCurrentUserId();

			// 1. Get the contacts off the device
			getLocalContacts().then(function(contacts) {

				var userContacts = {};
				var date = Date.now();
				
				contacts.forEach(function(contact) {

					// 3. Check each contact for phone numbers
					if (!contact.phoneNumbers) {
						return;
					}
						
					var contactObj = {};
					var contactId;
					var indexOffset = 0;

					contact.phoneNumbers.forEach(function(number, index) {
						var validNumber = PhoneSrvc.numberValidator(number.value);
						var offsetIndex = index + indexOffset;
						
						// if it's not a valid number, just ignore it.
						if (!validNumber.isValid) {
							indexOffset--;
							return;
						}

						// if this is the user, update the user contacts and skip the rest of the loop
						if (number.value === userPhoneNumber) {
							updateGlobalContacts(userPhoneNumber, {userId: userId});
							saveContactAsCurrentUser(userPhoneNumber, contact);
							indexOffset--;
							return;
						}
						
						// now we update the full contact if this is the first number
						// otherwise, we just add the number to the dupes list
						if (offsetIndex === 0) {
							contactId = validNumber.number;
							contactObj = {
								numberType: number.type || null,
								displayNumber: validNumber.displayNumber,
								lastUpdate: date,
								firstName: contact.name && contact.name.givenName || null,
								lastName: contact.name && contact.name.familyName || null,
								dupeNumbers: []
							};
							
							// if the contact has a photo, upload it
							if (window.cordova && contact.photos && contact.photos[0] && contact.photos[0].value) {
								PhotoSrvc.saveContactPhoto(validNumber.number, contact.photos[0].value);
							}

						} else {
							// add a dupeNumber reference to the primary contact
							if (!contactObj.dupeNumbers) {
								console.log(contactObj);
								console.log(validNumber.number);
								console.log(index);
								console.log(contact);
							}
							contactObj.dupeNumbers.push(validNumber.number);
							userContacts[validNumber.number] = {isDupeOf: contactId, lastUpdate: date};
						}

						// add each number, dupe or not, add it to the global contacts
						// do it here because firebase's update only goes down one level before overwriting
						updateGlobalContacts(validNumber.number, {userPhoneNumber: userId});
					});

					// done processing all the contact's phonenumbers, so we can add the complete
					// contactObj to the userContacts object we're going to send to the cloud
					userContacts[contactId] = contactObj;
				});
				
				// 9. Add the formatted contacts to the user contacts database
				userContactsRef.child(userPhoneNumber).update(userContacts, function(error) {
					if (error) {
						deferred.reject(error);
					} else {
						deferred.resolve(userContacts);
					}
				});

			}, function(error){
				deferred.reject(error);
			});

			return deferred.promise;
		}

		function updateUserContact(userContactId, phoneNumberKey, updateObj) {
			// note that the input here is pretty critical,
			// this will add/update anything you feed it
			var deferred = $q.defer();

			userContactsRef.child(userContactId).child(phoneNumberKey).update(updateObj, function(error){
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve(true);
				}
			});

			return deferred.promise;
		}

		function getContactByPhoneNumber(phoneNumber) {
			var deferred = $q.defer();
			var numValidatorObj = PhoneSrvc.numberValidator(phoneNumber.value);

			if (numValidatorObj.isValid) {
				
				userContactsRef.child('contacts').child(numValidatorObj.number).on('value', function(snapshot) {
					if (snapshot) {
						deferred.resolve(snapshot.val());
					} else {
						deferred.reject('Could not retrieve contact');
					}
				});
				
			} else {
				deferred.reject('Invalid number');
			}

			return deferred.promise;
		}

		function saveContactAsCurrentUser(phoneNumber, contact) {

			var saveData = {};

			if (contact.name){
				saveData.firstName = contact.name.givenName;
				saveData.lastName = contact.name.familyName;
			}

			if (contact.photos && contact.photos[0] && contact.photos[0].value) {
				PhotoSrvc.saveContactPhoto(phoneNumber, contact.photos[0].value, true);
			}

			if (contact.addresses) {
				saveData.addresses = contact.addresses;
			}

			return UserSrvc.saveCurrentUserData(saveData);
		}

			///////////////////////////
		 // Global Contacts Stuff //
		///////////////////////////

		var globalContactsRef = new Firebase('https://sup-test.firebaseio.com/globalContacts');

		function updateGlobalContacts(phoneNumber, data) {
			var deferred = $q.defer();

			globalContactsRef.child(phoneNumber).update(data, function(error) {
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve(data);
				}
			});

			return deferred.promise;
		}

		function globalNumberVerified(num) {
			var d = $q.defer();

			//when a registered user verifies their number, we need to iterate through
			//all contact data to update
			globalContactsRef.child(num).on('value', function(snapshot) {
				
				// get the global contact
				if (snapshot) {

					var currentUserId = UserSrvc.getCurrentUserId();

					// if the global contact doesn't have a userId, update it
					if (!snapshot.userId) {
						updateGlobalContacts(num, {userId: currentUserId});
					}

					// now, let's use the global contact to find the user's entry
					// in each user addressbook. And in each user's addressbook,
					// add the verified user Id
					for (var key in snapshot)  {
						if (key !== 'prototype' && key !== 'length' && key !== 'name' && (!snapshot.hasOwnProperty || snapshot.hasOwnProperty(key))) {
							updateUserContact(key, num, {userId: currentUserId});
						}
					}

					d.resolve('updated users');

				} else {
					d.reject('error fetching global contact');
				}
			});
		}

		return {
			getLocalContacts: getLocalContacts,
			uploadAllLocalContacts: uploadAllLocalContacts,
			getUserContacts: getUserContacts,
			updateCurrentUserContacts: updateCurrentUserContacts,
			updateUserContactsFromLocal: updateUserContactsFromLocal,
			updateUserContact: updateUserContact,
			getContactByPhoneNumber: getContactByPhoneNumber,
			globalNumberVerified: globalNumberVerified
		};
	}
);