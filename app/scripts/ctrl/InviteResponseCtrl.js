'use strict';

angular.module('SupAppIonic')
  .controller('InviteResponseCtrl', function($scope, $stateParams, EventSrvc, LoggingSrvc, ContactSrvc, PhoneSrvc) {

    var eventId, contactId, peep;
    var peepWasInvited = false;

    (function init(){

      $scope.confirmation = {show: false};
      $scope.ready = false;
      $scope.error = '';
      $scope.peepThere = false;

      eventId = $stateParams.eventId;
      contactId = $stateParams.contactId;

      if (!eventId || !contactId) {
        LoggingSrvc.addLog('invite', null, 'Hit invite respond page but was missing evntId or contactId', true);
        $scope.error = 'Sorry, but you\'re in the wrong place... ';
        return;
      }

      EventSrvc.getEvent(eventId).then(function(event){
        if (!event) {
          $scope.ready = true;
          return;
        }

        if (event.peepsInvited && event.peepsInvited.length) {
          event.peepsInvited.each(function(peepInvited){
            if (peepInvited.id === contactId) {
              peep = peepInvited;
              peepWasInvited = true;
            }
          });
        }

        if (!peep && event.peeps && event.peeps.length) {
          event.peeps.each(function(peepThere){
            peep = peepThere;
            $scope.peepThere = true;
          });
        }

        if (!peep) {
          LoggingSrvc.addLog('invite', null, 'Hit invite respond page but contact not found', true);
        } else {
          initPage(peep, event);
        }

      }, function(){
        LoggingSrvc.addLog('invite', null, 'Phone number ' + contactId + ' tried to respond to invite but event wasn\'t found', true);
      });


    })();

    function initPage(peep, event) {
      var text = 'join ';
      
      event.peeps.forEach(function(peep, index) {
        text += peep.name.fullName || peep.name.firstName;
        if (index === event.peeps.length - 1) {
          text += ' for';
        } else if (event.peeps.length === 2) {
          text += ' and ';
        } else {
          text += ', ';
        }
      });

      var url = 'http://maps.google.com/?q=';
      url += event.location.name;
      url += '&center=' +  event.location.location.lat + ',';
      url += event.location.location.lng;

      $scope.mapsLink = url;
      $scope.eventObj = event;
      $scope.text = text;
      $scope.peep = peep;
      $scope.ready = true;
    }

    $scope.getTimeAgo = function(timestamp) {
      var strMillis = timestamp;
      var date = Date.create(parseInt(strMillis));
      var minutesAgo = date.minutesAgo();
      if (minutesAgo < 60) {
        return minutesAgo + ' minutes ago';
      } else if (minutesAgo < 70) {
        return 'a little over an hour ago';
      } else if (minutesAgo < 80) {
        return 'an hour and a half ago';
      }  else if (minutesAgo < 110) {
        return 'almost two hours ago';
      }  else if (minutesAgo < 119) {
        return 'an hour ago';
      } else {
        return date.hoursAgo() + ' hours ago';
      }
    };

    $scope.respondNo = function () {
      $scope.confirmation = {
        show: true,
        type: 'passed'
      };

      // let inviter know that invitee passed
      // requires recording who invited when invited
    };

    $scope.respondYes = function () {
      $scope.confirmation = {
        show: true,
        type: 'accepted'
      };

      addPeepAndSaveEvent($scope.eventObj, $scope.peep);
      notifyEveryoneOfJoin($scope.eventObj, $scope.peep);
    };


    function addPeepAndSaveEvent(event, peep) {
      event.peepsInvited.remove(peep);
      event.peeps.push(peep);
      EventSrvc.updateEvent(eventId, angular.copy(event));
      LoggingSrvc.addLog('join', peep, 'joined event', false);
    }

    function notifyEveryoneOfJoin(event, peep) {
      var text = peep.name.fullName || peep.name.firstName;
      text += ' just said that they\'re going to join you at ' + event.location.name;
      
      event.peeps.each(function(){
        ContactSrvc.getAllNumbers(peep, peep.id).then(function(numbers){
          numbers.forEach(function(number){
            PhoneSrvc.sendMessage(number, text, peep.id);
          });
        });
      });
    }

    // function getOrganizer(event) {
    //   var id = event.createdBy;
    //   var organizer = event.peeps.find(function(peep) {
    //     return peep.id.toString() === id.toString();
    //   });

    //   return organizer;
    // }
  })
;