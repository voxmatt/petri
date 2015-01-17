'use strict';

(function() {

  var EVENT_TYPES = {
    MUSIC: {
      key: 'music',
      name: 'Music',
      section: 'arts',
      category: 'music',
      class:'event-music'
    },
    MOVIE: {
      key: 'movie',
      name: 'Movie',
      section: 'arts',
      category: 'movie',
      class:'event-movie'
    },
    DRINKS: {
      key: 'drinks',
      name: 'Drinks',
      section: 'drinks',
      category: 'drinks',
      class:'event-drinks'
    },
    FOOD: {
      key: 'food',
      name: 'Food',
      section: 'food',
      category: null,
      class:'event-food'
    },
    DANCING: {
      key: 'dancing',
      name: 'Dancin\'',
      section: null,
      category: 'dancing',
      class:'event-dancing'
    },
    OUTDOORS: {
      key: 'outdoors',
      name: 'Out doors',
      section: 'outdoors',
      category: null,
      class:'event-outdoors'
    },
    CHILLING: {
      key: 'chilling',
      name: 'Chillin\'',
      section: null,
      category: 'chilling',
      class:'event-chillin'
    }
  };

  var EVENT_TYPE_KEYS = {};

  var STEPS = {
    TYPE: {
      key: 'type',
      num: 1,
      text: 'What\'s on tap?',
      numOrbitCircles: 7,
      options: [],
    },
    LOCATION: {
      key: 'location',
      num: 2,
      text: 'Where to?',
      options: []
    },
    PEEPS: {
      key: 'peeps',
      num: 3,
      text: 'With who?'
    },
    SAVING: {
      key: 'saving',
      text: 'Saving...',
      options: []
    }
  };

  for (var key in EVENT_TYPES) {
    STEPS.TYPE.options.push(EVENT_TYPES[key]);
    EVENT_TYPE_KEYS[key] = EVENT_TYPES[key].key;
  }

  angular.module('SupAppIonic').constant('EventCnst', {

    EVENT_TYPES: EVENT_TYPES,
    STEPS: STEPS,
    EVENT_TYPE_KEYS: EVENT_TYPE_KEYS
  });
})();