'use strict';
/*global cordova, StatusBar*/

angular.module('SupAppIonic', [
    'ionic',
    'config',
    'ngCordova',
    'ui.router',
    'firebase'
  ])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  // needed for route security provider to work
  .constant('loginRedirectPath', '/login')

  .config(function($stateProvider, $urlRouterProvider) {
    
    $urlRouterProvider.otherwise('/onboarding');

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
    ;
  })
;