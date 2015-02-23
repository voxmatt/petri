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

		var userContactsRef = new Firebase('https://petri.firebaseio.com/userContacts');

		function getDeviceContacts() {
			// get's the contacts off the user's device

			var deferred = $q.defer();

			if (window.cordova){

				// if we're native, do the native contact stuff
				var options = new ContactFindOptions();
				options.multiple = true;
				options.desiredFields = ['name','phoneNumbers'];
				var fields = ['*'];

				navigator.contacts.find(fields, function(contacts) {
					deferred.resolve(contacts);
				}, function(error) {
					deferred.reject(error);
				}, options);

			} else {
				// otherwise, return something for debugging
				deferred.resolve(DebuggingData.addressbookNoPhotos);
			}

			return deferred.promise;
		}

		function getContacts(){
			var deferred = $q.defer();

			var localContacts = getContactsLocally();
			if (localContacts && localContacts.length) {
				deferred.resolve(localContacts);
				return deferred.promise;
			}

			UserSrvc.getCurrentUser().then(function(user){
				userContactsRef.child(user.contactId).on('value', function(snapshot) {
					if (snapshot) {
						var contacts = snapshot.val();
						saveContactsLocally(contacts);
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

		function updateContact(data, phoneNumberKey) {
			var d = $q.defer();

			UserSrvc.getCurrentUser().then(function(user){
				userContactsRef.child(user.contactId).child(phoneNumberKey).update(data, function(error){
					if (error) {
						d.reject(error);
					} else {
						var localContacts = getContactsLocally();
						localContacts[phoneNumberKey] = data;
						saveContactsLocally(localContacts);
						d.resolve('Updated Contact');
					}
				});
			}, function (error){
				d.reject(error);
			});

			return d.resolve;
		}

		function bulkUpdateContacts(data) {
			var d = $q.defer();

			UserSrvc.getCurrentUser().then(function(user){
				userContactsRef.child(user.contactId).update(data, function(error){
					if (error) {
						d.reject(error);
					} else {
						saveContactsLocally(data);
						d.resolve('Updated User Contacts');
					}
				});
			}, function (error){
				d.reject(error);
			});

			return d.resolve;
		}

		function updateContactForOtherUser(userContactId, phoneNumberKey, updateObj) {
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

		// this function does a metric fuck-ton...
		function bulkUpdateContactsFromDevice(userPhoneNumber){

			var deferred = $q.defer();
			var userId = UserSrvc.getCurrentUserId();

			// 1. Get the contacts off the device
			getDeviceContacts().then(function(contacts) {

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
						if (validNumber.number === userPhoneNumber) {
							addUserIdToGlobalContact(userPhoneNumber, userId);
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
							
							// NOT DOING THIS FOR NOW
							// if the contact has a photo, upload it
							// if (window.cordova && contact.photos && contact.photos[0] && contact.photos[0].value) {
							// 	PhotoSrvc.saveContactPhoto(validNumber.number, contact.photos[0].value);
							// }

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
						addUserNumberToGlobalContact(validNumber.number, userPhoneNumber);

						// updating in batch probably overwrites... but it's faster for now
						//globalContacts[validNumber.number] = {userPhoneNumber: userId};
					});

					// done processing all the contact's phonenumbers, so we can add the complete
					// contactObj to the userContacts object we're going to send to the cloud
					userContacts[contactId] = contactObj;
				});
				
				// 9. Add the formatted contacts to the user contacts database
				updateContactsLocally(userContacts);
				userContactsRef.child(userPhoneNumber).update(userContacts, function(error) {
					if (error) {
						deferred.reject(error);
					} else {
						deferred.resolve(userContacts);
					}
				});

				//updateGlobalContactsBatch(globalContacts);

			}, function(error){
				deferred.reject(error);
			});

			return deferred.promise;
		}

		function getContactByPhoneNumber(phoneNumber) {
			var deferred = $q.defer();
			var numValidatorObj = PhoneSrvc.numberValidator(phoneNumber.value);

			var localContacts = getContactsLocally();
			if (localContacts && localContacts[phoneNumber]) {
				deferred.resolve(localContacts[phoneNumber]);
				return deferred.promise;
			}

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

		var globalContactsRef = new Firebase('https://petri.firebaseio.com/globalContacts');

		function updateGlobalContact(phoneNumber, data) {
			var deferred = $q.defer();

			var updateObj = {};
			updateObj[phoneNumber] = data;

			globalContactsRef.update(updateObj, function(error) {
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve(data);
				}
			});

			return deferred.promise;
		}

		function addUserIdToGlobalContact(phoneNumber, userId) {
			return updateGlobalContact(phoneNumber, {userId: userId});
		}

		function addUserNumberToGlobalContact(globalContactNumber, userNumber) {
			var deferred = $q.defer();

			globalContactsRef.child(globalContactNumber + '/userContactRefs').push(userNumber, function(error) {
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve('success');
				}
			});

			return deferred.promise;
		}

		function updateGlobalContactsBatch(data) {
			var deferred = $q.defer();

			globalContactsRef.update(data, function(error) {
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
			globalContactsRef.child(num + '/userContactRefs').on('value', function(snapshot) {
				
				// get the global contact
				if (snapshot) {

					var currentUserId = UserSrvc.getCurrentUserId();

					// now, let's use the global contact to find the user's entry
					// in each user addressbook. And in each user's addressbook,
					// add the verified user Id
					if (snapshot.val()) {
						snapshot.val().each(function(contactId){
							updateContactForOtherUser(contactId, num, {userId: currentUserId});
						});
					}

					d.resolve('updated users');

				} else {
					d.reject('error fetching global contact');
				}
			});
		}

		function saveContactsLocally(contacts) {
			window.localStorage.userContacts = JSON.stringify(contacts);
		}

		function getContactsLocally() {
			return JSON.parse(window.localStorage.userContacts || null);
		}

		function updateContactsLocally() {
			UserSrvc.getCurrentUser().then(function(user){
				userContactsRef.child(user.contactId).on('value', function(snapshot) {
					if (snapshot) {
						saveContactsLocally(snapshot.val());
					}
				});
			});
		}

		function getAllNumbers(contact, contactNumber) {
			var d = $q.defer();
			var numberSet = [];

			// first check if this number is a dupe of something else
			if (contact.isDupeOf && contact.isDupeOf.length) {
				// capture the real contact's number in the numberset
				numberSet.push(contact.isDupeOf);

				// now get the real contact and get the dupe contacts off that
				getContactByPhoneNumber(contact.isDupeOf).then(function(realContact){
					var dupes = realContact.dupeNumbers || null;
					if (dupes) {
						for (var key in dupes) {
							if (dupes.hasOwnProperty(key)){
								numberSet.push(dupes[key]);
							}
						}
					}
					
					d.resolve(numberSet);
				});
			} else if (contact.dupeNumbers) {
				numberSet.push(contactNumber);

				for (var key in contact.dupeNumbers) {
					if (contact.dupeNumbers.hasOwnProperty(key)){
						numberSet.push(contact.dupeNumbers[key]);
					}
				}
				d.resolve(numberSet);
			} else {
				d.resolve([contactNumber]);
			}

			return d.promise;
		}

		function incrementContactUsedCount(contact) {
			getContactByPhoneNumber(contact.id).then(function(contactObj){
				if (contactObj) {
					contactObj.numTimesIncluded = contactObj.numTimesIncluded || 0;
					contactObj.numTimesIncluded++;
					updateContact(contactObj, contact.id);
				}
			});
		}

		return {
			getDeviceContacts: getDeviceContacts,
			getContacts: getContacts,
			updateContact: updateContact,
			bulkUpdateContacts: bulkUpdateContacts,
			bulkUpdateContactsFromDevice: bulkUpdateContactsFromDevice,
			updateContactForOtherUser: updateContactForOtherUser,
			getContactByPhoneNumber: getContactByPhoneNumber,
			globalNumberVerified: globalNumberVerified,
			updateGlobalContact: updateGlobalContact,
			updateGlobalContactsBatch: updateGlobalContactsBatch,
			saveContactsLocally: saveContactsLocally,
			getContactsLocally: getContactsLocally,
			updateContactsLocally: updateContactsLocally,
			getAllNumbers: getAllNumbers,
			incrementContactUsedCount: incrementContactUsedCount
		};
	}
);