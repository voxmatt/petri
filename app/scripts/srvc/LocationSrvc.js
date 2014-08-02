'use strict';

angular.module('SupAppIonic')

  .factory('LocationSrvc', function ($q, $http, FoursquareCnst) {
    //var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=';

    function getLatLong() {
      var deferred = $q.defer();
      navigator.geolocation.getCurrentPosition(function (successResult) {
        deferred.resolve(successResult);
      }, function (errorResult) {
        deferred.reject(errorResult);
      });

      return deferred.promise;
    }

    function getFoursquareVenues(num, section, includePhotos, onlyOpen, sortByDistance) {
      var deferred = $q.defer();

      getLatLong().then( function(result) {
        var url = getVenuesUrl(result.coords, num, section, includePhotos, onlyOpen, sortByDistance);
        $http.get(url).success(function(result){
          deferred.resolve(result);
        }).error(function(result){
          deferred.reject(result);
        });
      }, function (errorResult) {
        deferred.reject(errorResult);
      });

      return deferred.promise;
    }

    function getFoursqaurePhotoUrl(venue, size){
      var dimensions = '500x500';
      if (size === 'small'){
        dimensions = '100x100';
      } else if (size === 'medium'){
        dimensions = '300x300';
      }

      if (venue.photos && venue.photos.groups[0] && venue.photos.groups[0].items[0] && venue.photos.groups[0].items[0].prefix && venue.photos.groups[0].items[0].suffix) {
        return venue.photos.groups[0].items[0].prefix + dimensions + venue.photos.groups[0].items[0].suffix;
      }
      return null;
    }

    function getVenuesUrl(coords, num, section, includePhotos, onlyOpen, sortByDistance){
      var url = FoursquareCnst.credentials.venuesUrl;
      url += coords.latitude + ',' + coords.longitude;
      url += '&client_id=' + FoursquareCnst.credentials.clientId;
      url += '&client_secret=' + FoursquareCnst.credentials.clientSecret;
      url += '&v=' + Date.create().format('{yyyy}{mm}{dd}');

      if (num) {
        url += '&limit=' + num;
      }

      if (section) {
        url += '&section=' + section;
      }

      if (includePhotos) {
        url += '&venuePhotos=1';
      }

      if (onlyOpen) {
        url += '&openNow=1';
      }

      if (sortByDistance) {
        url += '&sortByDistance=1';
      }

      return url;
    }

    return {
      getLatLong: getLatLong,
      getFoursquareVenues: getFoursquareVenues,
      getFoursqaurePhotoUrl: getFoursqaurePhotoUrl
    };
  }
);