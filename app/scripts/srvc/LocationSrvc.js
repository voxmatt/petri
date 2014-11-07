'use strict';

angular.module('SupAppIonic')

  .factory('LocationSrvc', function ($q, $http, $rootScope, FoursquareCnst, UserSrvc) {
    //var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=';

    function getLatLong() {
      var deferred = $q.defer();

      UserSrvc.saveCurrentUserData({locationApproved: true});

      navigator.geolocation.getCurrentPosition(function (successResult) {
        deferred.resolve(successResult);
        window.localStorage.lastLatLong = JSON.stringify(successResult.coords);
      }, function (errorResult) {
        deferred.reject(errorResult);
      });

      return deferred.promise;
    }

    function getFoursquareVenues(num, section, includePhotos, onlyOpen, sortByDistance) {
      var deferred = $q.defer();
      var lastLatLong = JSON.parse(window.localStorage.lastLatLong || '{}');
      var cached = JSON.parse(window.localStorage.foursquare || '{}');
      var distance = null;

      getLatLong().then( function(result) {
        
        if (lastLatLong) {
          distance = getDistanceBtwn(lastLatLong.latitude, lastLatLong.longitude, result.coords.latitude, result.coords.longitude);
        }

        if (cached && distance && distance < 250) {
          // if there are cached results and the user has moved less than a 1/4 km, just
          // return the cached results
          deferred.resolve(cached);
          return deferred.promise;
        }

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


    function cacheFourSquareVenues() {

      var user = UserSrvc.getUserLocally();
      var d = $q.defer();

      if (!user || !user.locationApproved) {
        d.reject(false);
        return d.promise;
      }
      
      getFoursquareVenues(100, null, true, true, true).then(function(result){
        window.localStorage.foursquare = JSON.stringify(result);
        d.resolve('success');
      }, function(error){
        d.reject(error);
      });

      return d.promise;
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

    function getStaticDistanceAway(distance, returnMetric) {
      var feetInMeter = 3.28084;
      var distanceFeet = distance * feetInMeter;

      if (returnMetric && distance > 500) {
        var kms = (distance / 1000).toFixed(1);
        return { num: kms, unit: 'km', display: kms + ' km'};
      } else if (returnMetric) {
        return { num: distance, unit: 'km', display: distanceFeet + ' km'};
      }

      if (distanceFeet > 1760) {
        var miles = (distanceFeet / 5280).toFixed(1);
        return { num: miles, unit: 'mi', display: miles + ' mi'};
      }

      return { num: Math.round(distanceFeet), unit: 'ft', display: Math.round(distanceFeet) + ' ft'};
    }

    function getDistanceBtwn(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1);
      var a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var d = R * c; // Distance in km
      return d;
    }

    function deg2rad(deg) {
      return deg * (Math.PI/180);
    }

    return {
      getLatLong: getLatLong,
      getFoursquareVenues: getFoursquareVenues,
      getFoursqaurePhotoUrl: getFoursqaurePhotoUrl,
      getStaticDistanceAway: getStaticDistanceAway,
      cacheFourSquareVenues: cacheFourSquareVenues
    };
  }
);