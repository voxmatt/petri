'use strict';
/* global Firebase */

angular.module('SupAppIonic')

	.factory('PhotoSrvc', function($q) {

		var ref = new Firebase('https://petri.firebaseio.com/contactPhotos');

		function saveContactPhoto(phoneNumber, imgPath, isVerified) {
			var d = $q.defer();
			var isVer = isVerified || false;
			
			getImageDataUrl(imgPath).then(function(dataUrl) {
				ref.child(phoneNumber).update({src: dataUrl, verified: isVer}, function(error){
					if (error) {
						d.reject(error);
					} else {
						d.resolve(dataUrl);
					}
				});

				return d.promise;
			});
		}

		function getContactPhoto(phoneNumber) {
			var d = $q.defer();
			
			ref.child(phoneNumber).on('value', function(snapshot) {
				if (snapshot) {
					d.resolve(snapshot.val());
				} else {
					d.reject('Contact has no photo');
				}
			});
			
			return d.promise;
		}

		function getImageDataUrl(imgPath) {
			var d = $q.defer();
			var img = new Image();
			img.src = imgPath;

			img.onload = function () {
				var canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;

				// Copy the image contents to the canvas
				var ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0);

				// Get the data-URL formatted image
				// Firefox supports PNG and JPEG. You could check img.src to guess the
				// original format, but be aware the using 'image/jpg' will re-encode the image.
				d.resolve(canvas.toDataURL('image/png'));
			};

			return d.promise;
		}

		return {
			getImageDataUrl: getImageDataUrl,
			saveContactPhoto: saveContactPhoto,
			getContactPhoto: getContactPhoto
		};
	})
;