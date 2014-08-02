'use strict';

angular.module('SupAppIonic')
  .constant('FoursquareCnst', 
    {
      credentials: {
        venuesUrl: 'https://api.foursquare.com/v2/venues/explore?ll=',
        clientId: 'ZRHG5U3N2BXB3NWGROC0XT1OE0F423DWOXDSNUHF4WBLQOPC',
        clientSecret: 'GH2QXS5KQ44ZKCV5YKYVZIV0CAEOUOG5ZLVBA2VQF4XAZILS',
      },
      categoryGroups: {
        music: [
          '5032792091d4c4b30a586d5c', 
          '4bf58dd8d48988d1e5931735', 
          '4bf58dd8d48988d1f2931735',
          '52e81612bcbc57f1066b79ec',
          '4bf58dd8d48988d1af941735',
          '4bf58dd8d48988d1b0941735',
          '4d4b7105d754a06373d81259'],
        movie: [
          '4bf58dd8d48988d1f1931735', 
          '4bf58dd8d48988d17f941735',
          '4bf58dd8d48988d1af941735'],
        drinks: [
          '4bf58dd8d48988d181941735', 
          '4bf58dd8d48988d1b0941735',
          '4bf58dd8d48988d141941735',
          '4d4b7105d754a06376d81259'],
        food: [
          '4bf58dd8d48988d181941735',
          '4d4b7105d754a06374d81259',
          '4bf58dd8d48988d1f9941735'],
        outdoors: ['4d4b7105d754a06377d81259']
      },
      sections: ['food', 'drinks', 'coffee', 'shops', 'arts', 'outdoors', 'sights', 'trending', 'special']
    }
  )
;