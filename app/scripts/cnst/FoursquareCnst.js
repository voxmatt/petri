'use strict';

angular.module('SupAppIonic').constant('FoursquareCnst', {
  credentials: {
    venuesUrl: 'https://api.foursquare.com/v2/venues/explore?ll=',
    venuesSearchUrl: 'https://api.foursquare.com/v2/venues/search?ll=',
    clientId: 'ZRHG5U3N2BXB3NWGROC0XT1OE0F423DWOXDSNUHF4WBLQOPC',
    clientSecret: 'GH2QXS5KQ44ZKCV5YKYVZIV0CAEOUOG5ZLVBA2VQF4XAZILS',
  },
  categoryGroups: {
    music: {
      narrow: [
        '4bf58dd8d48988d1e5931735',
        '5267e4d9e4b0ec79466e48d1',
        '4bf58dd8d48988d11f941735'
      ],
      expansive: [
        '4bf58dd8d48988d1e5931735',
        '4bf58dd8d48988d1f1931735',
        '5032792091d4c4b30a586d5c',
        '52e81612bcbc57f1066b79ef',
        '4bf58dd8d48988d1f2931735',
        '52e81612bcbc57f1066b79ec',
        '4bf58dd8d48988d1af941735',
        '4bf58dd8d48988d1ac941735',
        '4bf58dd8d48988d1b0941735',
        '5267e4d9e4b0ec79466e48c7',
        '5267e4d9e4b0ec79466e48d1',
        '5267e4d8e4b0ec79466e48c5',
        '4d4b7105d754a06376d81259'
      ]
    },
    movie: {
      narrow: [
        '4bf58dd8d48988d17f941735',
        '4bf58dd8d48988d17e941735',
        '4bf58dd8d48988d180941735'
      ],
      expansive: [
        '4bf58dd8d48988d17f941735',
        '4bf58dd8d48988d181941735',
        '4bf58dd8d48988d1f2931735',
        '4bf58dd8d48988d184941735',
        '4bf58dd8d48988d1ac941735'
      ]
    },
    drinks: {
      narrow: [
        '4d4b7105d754a06376d81259'
      ],
      expansive: [
        '4d4b7105d754a06376d81259',
        '5267e4d9e4b0ec79466e48d1',
        '5267e4d9e4b0ec79466e48c8',
        '52741d85e4b0d5d1e3c6a6d9',
        '5267e4d8e4b0ec79466e48c5',
        '4d4b7105d754a06374d81259',
        '52e81612bcbc57f1066b7a33',
        '4bf58dd8d48988d186941735',
        '4eb1bc533b7b2c5b1d4306cb',
        '4f04b25d2fb6e1c99f3db0c0'
      ]
    },
    food: {
      narrow: ['4d4b7105d754a06374d81259'],
      expansive: [
        '4bf58dd8d48988d181941735',
        '4d4b7105d754a06374d81259',
        '4bf58dd8d48988d1f9941735'
      ]
    },
    outdoors: {
      narrow: ['4d4b7105d754a06377d81259'],
      expansive: ['4d4b7105d754a06377d81259']
    },
    dancing: {
      narrow: [
        '4bf58dd8d48988d11f941735',
        '4bf58dd8d48988d1e5931735',
        '4bf58dd8d48988d1b0941735'
      ],
      expansive: [
        '4bf58dd8d48988d1d6941735',
        '52e81612bcbc57f1066b79ef',
        '4bf58dd8d48988d1e5931735',
        '52e81612bcbc57f1066b79ec',
        '4d4b7105d754a06376d81259',
        '4bf58dd8d48988d1f2931735',
        '4bf58dd8d48988d1af941735',
        '4bf58dd8d48988d1a1941735',
        '4bf58dd8d48988d1a9941735',
        '4bf58dd8d48988d1ac941735',
        '4bf58dd8d48988d1b0941735',
        '4d4b7105d754a06373d81259'
      ]
    },
    chilling: {
      narrow: [
        '4e67e38e036454776db1fb3a'
      ],
      expansive: [null]
    }
  },
  sections: ['food', 'drinks', 'coffee', 'shops', 'arts', 'outdoors', 'sights', 'trending', 'special']
});