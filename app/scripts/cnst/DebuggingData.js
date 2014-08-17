'use strict';

angular.module('SupAppIonic').constant('DebuggingData', {
  contacts: [
    {
      name : {
        givenName: 'Matt',
        familyName: 'Martin'
      },
      addresses: [
        {
          type: 'home',
          streetAddress: '21 Clarence Place',
          locality: 'San Francisco',
          region: 'CA',
          postalCode: '94107'
        },
        {
          type: 'work',
          streetAddress: '502 Emerson Street',
          locality: 'Palo Alto',
          region: 'CA',
          postalCode: '94301'
        }
      ],
      phoneNumbers: [
        {
          type: 'mobile',
          value: '+1-612-7902118'
        },
        {
          type: 'home',
          value: '(763)473-6044'
        }
      ],
      photos: [
        {
          type: '',
          value: ''
        }
      ]
    },
    {
      name : {
        givenName: 'Decker',
        familyName: 'Herfurth'
      },
      addresses: [
        {
          type: 'home',
          streetAddress: '1467 Dude Street',
          locality: 'LA',
          region: 'CA',
          postalCode: '99999'
        }
      ],
      phoneNumbers: [
        {
          type: 'mobile',
          value: '+1-5555555'
        },
        {
          type: 'home',
          value: '+1-666-888-1010'
        },
        {
          type: 'other',
          value: '+1-223-657-1010'
        }
      ],
      photos: [
        {
          type: '',
          value: ''
        }
      ]
    }
    
  ]
});