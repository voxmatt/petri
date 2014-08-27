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
				var fields = ['name', 'addresses', 'emails', 'phoneNumbers', 'addresses', 'photos'];

				navigator.contacts.find(fields, function(contacts) {
					deferred.resolve(contacts);
				}, function(error) {
					deferred.reject(error);
				}, options);

			} else {
				// otherwise, return something for debugging
				deferred.resolve(DebuggingData.contacts);
			}

			return deferred.promise;
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

		// this function does a metric fuck-ton...
		function updateUserContactsFromLocal(){

			var deferred = $q.defer();

			// 1. Get the current user so we know where to store the contacts
			UserSrvc.getCurrentUser().then(function(user) {
				if (user.contactId) {
					
					var userPhoneNumber = user.contactId;
				
					// 2. Get the contacts off the device
					getLocalContacts().then(function(contacts) {
						var formattedContacts = {};
						
						contacts.forEach(function(contact) {

							// 3. Check each contact for phone numbers
							if (contact.phoneNumbers) {
								
								var validNumbers = [];
								var dupeNumbers = [];

								// 4. Only valid phone numbers are worthwhile
								contact.phoneNumbers.forEach(function(phoneNumber) {
									var numValidatorResult = PhoneSrvc.numberValidator(phoneNumber.value);

									if (numValidatorResult.isValid) {
										numValidatorResult.type = phoneNumber.type || null;
										validNumbers.push(numValidatorResult);
										dupeNumbers.push(numValidatorResult.number);
									}
								});

								// 5. Check if the contact is the user, if it is, update the user
								var self = validNumbers.find(function(number){
									return number.number === userPhoneNumber;
								});
								if (self){
									updateGlobalContacts(userPhoneNumber, {userId: user.id});
									saveContactAsCurrentUser(userPhoneNumber, contact);
									validNumbers = [];
								}

								// 6. Now iterate over each valid number that this contact has
								validNumbers.forEach(function(number, index) {
									var contactObj = {
										numberType: number.type,
										displayNumber: number.displayNumber,
										lastUpdate: Date.now()
									};

									if (index === 0){ // only provide the complete info for the first one
										var dupeNumCopy = angular.copy(dupeNumbers);
										if (dupeNumCopy.length){
											dupeNumCopy.remove(function(num) {
												return number.number === num;
											});
											contactObj.dupeContacts = dupeNumCopy;
										}

										if (contact.name){
											contactObj.firstName = contact.name.givenName;
											contactObj.lastName = contact.name.familyName;
										}

										if (contact.photos && contact.photos[0] && contact.photos[0].value) {
											PhotoSrvc.saveContactPhoto(number.number, contact.photos[0].value);
										}

										if (contact.addresses) {
											contactObj.addresses = contact.addresses;
										}
									} else { //all others get a stub object and a reference to the complete info
										contactObj.isDupeOf = validNumbers[0].number;
									}

									// 7. Add the formatted contact to the object we're going to send to the cloud
									formattedContacts[number.number] = contactObj;

									// 8. Update the global contact ref for this contact
									var globalContactObj = {};
									globalContactObj[userPhoneNumber] = user.id;
									updateGlobalContacts(number.number, globalContactObj);
								});
							}
						});
						
						// 9. Add the formatted contacts to the user contacts database
						userContactsRef.child(userPhoneNumber).update(formattedContacts, function(error) {
							if (error) {
								deferred.reject(error);
							} else {
								deferred.resolve(formattedContacts);
							}
						});

					}, function(error){
						deferred.reject(error);
					});

				} else {
					deferred.reject('Unable to fetch contactId for current user');
				}
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

		return {
			getLocalContacts: getLocalContacts,
			getUserContacts: getUserContacts,
			updateUserContactsFromLocal: updateUserContactsFromLocal,
			updateUserContact: updateUserContact,
			getContactByPhoneNumber: getContactByPhoneNumber
		};
	}
);