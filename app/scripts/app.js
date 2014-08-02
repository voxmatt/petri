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
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByName('gray');
      }
    });
  })

  .config(function($stateProvider, $urlRouterProvider) {
    
    $urlRouterProvider.otherwise('/home');

    $stateProvider
        
      // HOME STATES AND NESTED VIEWS ========================================
      .state('home', {
        url: '/home',
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
      })
      
      // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
      .state('about', {
        // we'll get to this in a bit       
      })
    ;
  })
;