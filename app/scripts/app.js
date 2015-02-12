'use strict';
/* jshint unused: false */
/*global cordova, StatusBar*/

angular.module('SupAppIonic', [
    'ngAnimate',
    'ionic',
    'config',
    'ngCordova',
    'ui.router',
    'firebase',
    'angular-gestures'
  ])

  .run(function ($ionicPlatform, $window, $state, StateSrvc) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }

      if (window.cordova) {
        navigator.geolocation.getCurrentPosition();
      }
      
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

    });

    $window.addEventListener('PertiCustomUrl', function(e) {
      var url = e.detail.url;

      if (url.split('petri://').length > 1 ) {
        // NOTE, THIS WILL BREAK REAL FAST IF URLS ARE USED FOR MORE THAN EVENT IDS
        var eventId = url.split('event?=')[1];
        
        if (eventId) {
          StateSrvc.setViewingEventId(eventId);
          $state.go('events');
        } else {
          $state.go('events');
        }
      }
    });
  })

  // needed for route security provider to work
  .constant('loginRedirectPath', '/login')

  .config(function($stateProvider, $urlRouterProvider, $compileProvider, $httpProvider) {

    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|content):|data:image\//);
    
    // as a cheap hack, onboarding handles initial loading right now
    $urlRouterProvider.otherwise('/onboarding');

    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $stateProvider
        
      .state('events', {
        authRequired: true,
        url: '/events',
        templateUrl: 'views/events.html',
        controller: 'EventsCtrl'
      })

      .state('login', {
        authRequired: false,
        url: '/login',
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      
      .state('onboarding', {
        authRequired: true,
        url: '/onboarding',
        templateUrl: 'views/onboarding.html',
        controller: 'OnboardingCtrl'
      })

      .state('newEvent', {
        authRequired: true,
        url: '/new-event',
        templateUrl: 'views/new-event.html',
        controller: 'NewEventCtrl'
      })

      .state('editEvent', {
        authRequired: true,
        url: '/edit-event/:id/:step',
        templateUrl: 'views/new-event.html',
        controller: 'NewEventCtrl'
      })

      .state('logs', {
        authRequired: true,
        url: '/logs',
        templateUrl: 'views/logs.html',
        controller: 'LogsCtrl'
      })

    ;
  })

  .filter('orderByKey', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        if (item && item[field]) {
          filtered.push(item);
        }
      });
      filtered.sort(function (a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if(reverse) {
        filtered.reverse();
      }
      return filtered;
    };
  })
;

function handleOpenURL(url) {
  var event = new CustomEvent('PertiCustomUrl', {detail: {'url': url}});
  setTimeout(function() {
    window.dispatchEvent(event);
  }, 0 );
}