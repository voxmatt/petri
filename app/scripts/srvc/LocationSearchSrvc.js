// NOT IN USE!!

'use strict';

angular.module('SupAppIonic')

  .factory('LocationSrvc', function ($q, $http, $rootScope, FoursquareCnst, UserSrvc) {
    //var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=';

    function getLatLong() {
      var deferred = $q.defer();
      var cache = JSON.parse(window.localStorage.lastLocation || null);

      UserSrvc.saveCurrentUserData({locationApproved: true});

      // if it's been less than 4 minutes, just return the last location
      if (cache && (Date.now() - cache.timestamp) < 240000) {
        deferred.resolve(cache.coords);
        return deferred.promise;
      }

      navigator.geolocation.getCurrentPosition(function (successResult) {
        //cache the location
        window.localStorage.lastLocation = JSON.stringify(successResult);

        deferred.resolve(successResult.coords);
      }, function (errorResult) {
        deferred.reject(errorResult);
      });

      return deferred.promise;
    }

    function getFoursquareVenues(num, categoryName, categoryScope) {
      var deferred = $q.defer();
      var cache = JSON.parse(window.localStorage.foursquare || null);

      getLatLong().then( function(coordinates) {
        
        // check to see if we should use the cached items or not
        // conditions are if the user has moved less than 250 meters 
        // and it's been less than 10 minutes since last fetch
        if (isCacheFresh(cache, coordinates, 250, 600000) && categoryScope === 'narrow') {
          deferred.resolve(getCachedItems(num, categoryName));
          return deferred.promise;
        }

        var url = getVenuesUrl(coordinates, num, categoryName, categoryScope);
        
        $http.get(url).success(function(foursquareItems){
          deferred.resolve(processLocations(foursquareItems));
        }).error(function(result){
          deferred.reject(result);
        });
      }, function (errorResult) {
        deferred.reject(errorResult);
      });

      return deferred.promise;
    }


    function cacheFoursquare() {

      var user = UserSrvc.getUserLocally();
      var d = $q.defer();

      if (!user || !user.locationApproved) {
        d.reject(false);
        return d.promise;
      }
      
      var promises = [];

      for (var key in FoursquareCnst.categoryGroups) {
        promises.push(getFoursquareVenues(10, key, 'narrow'));
      }

      $q.all(promises).then(function(results){
        var i = 0;
        for (var key in FoursquareCnst.categoryGroups) {
          saveCache(results[i], key);
          i++;
        }
        var lastFetched = Date.now();
        saveCache(lastFetched, 'lastFetched');
      }).finally(function(){
        d.resolve('finished');
      });

      return d.promise;
    }

    function getFoursquarePhotoUrl(venue, size){
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

    function getVenuesUrl(coords, num, categoryName, categoryScope){
      var url = FoursquareCnst.credentials.venuesUrl;
      url += coords.latitude + ',' + coords.longitude;
      url += '&client_id=' + FoursquareCnst.credentials.clientId;
      url += '&client_secret=' + FoursquareCnst.credentials.clientSecret;
      url += '&v=' + Date.create().format('{yyyy}{mm}{dd}');
      url += '&vintent=checkin';

      if (num) {
        url += '&limit=' + num;
      }

      // if (section) {
      //   url += '&section=' + section;
      // }

      if (categoryName && categoryScope) {
        var categories = FoursquareCnst.categoryGroups[categoryName][categoryScope];
        url += '&categoryId=' + categories.join(',');
      }

      // if (includePhotos) {
      //   url += '&venuePhotos=1';
      // }

      // if (onlyOpen) {
      //   url += '&openNow=1';
      // }

      // if (sortByDistance) {
      //   url += '&sortByDistance=1';
      // }

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

    function saveCache(data, key) {
      window.localStorage.foursquare[key] = JSON.stringify(data);
    }

    function getCachedItems(categoryName) {

      var cachedItems = JSON.parse(window.localStorage.foursquare || null);

      return cachedItems[categoryName];
    }

    function processLocations(locations){
      // the actual results are kind of burried on the results
      // the result object itself has non-useful meta data; the response object has
      // some useful stuff like suggested bounds, but we have no use for those
      locations = locations.response.venues;

      var processedLocations = [];

      locations.each(function(loc){
        var locOption = {
          name: loc.venue.name.truncate(15, 'right', ''),
          categories: loc.venue.categories || null,
          contact: loc.venue.contact || null,
          hours: loc.venue.hours.status || null,
          photoUrl: getFoursquarePhotoUrl(loc.venue, 'small'),
          price: loc.venue.price || null,
          rating: loc.venue.rating || null,
          id: loc.venue.id,
          location: loc.venue.location || null,
          website: loc.venue.url,
          menu: loc.venue.menu || null
        };

        if (locOption.location && locOption.location.distance) {
          var distObj = getStaticDistanceAway(locOption.location.distance);
          locOption.tempDistAway = distObj.display;
        }
        processedLocations.push(locOption);
      });

      return processedLocations;
    }

    function isCacheFresh(cache, currentLatLong, distanceInMeters, timeInMillis) {

      if (!cache || !cache.lastFetched) {
        return false;
      }

      var timeOk = (Date.now() - cache.lastFetched.time) < timeInMillis;
      var distance = getDistanceBtwn(cache.lastFetched.latitude, cache.lastFetched.longitude, currentLatLong.latitude, currentLatLong.longitude);
      var distanceOk = distance < distanceInMeters;

      return timeOk && distanceOk;
    }

    return {
      getLatLong: getLatLong,
      getFoursquareVenues: getFoursquareVenues,
      getStaticDistanceAway: getStaticDistanceAway,
      cacheFoursquare: cacheFoursquare
    };
  }
);