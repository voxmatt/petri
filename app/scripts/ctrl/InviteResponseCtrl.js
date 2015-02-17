'use strict';

angular.module('SupAppIonic')
  .controller('InviteResponseCtrl', function($scope, $stateParams, EventSrvc, LoggingSrvc) {

    var eventId, contactId, eventObj, peep;
    var peepWasInvited = false;

    $scope.ready = false;
    $scope.error = '';

    (function init(){

      eventId = $stateParams.eventId;
      contactId = $stateParams.contactId;

      if (!eventId || !contactId) {
        LoggingSrvc.addLog('invite', null, 'Hit invite respond page but was missing evntId or contactId', true);
        $scope.error = 'Sorry, but you\'re in the wrong place... ';
        return;
      }

      EventSrvc.getContact(eventId).then(function(event){
        eventObj = event;
        $scope.ready = true;

        if (eventObj.peepsInvited && eventObj.peepsInvited.length) {
          eventObj.peepsInvited.each(function(peepInvited){
            if (peep.id === $stateParams.contactId.toString()) {
              peep = peepInvited;
              peepWasInvited = true;
            }
          });
        }

        if (!peep && eventObj.peeps && eventObj.peeps.length) {
          eventObj.peeps.each(function(peepThere){
            peep = peepThere;
          });
        }

        if (!peep) {
          LoggingSrvc.addLog('invite', null, 'Hit invite respond page but contact not found', true);
        }

      }, function(){
        LoggingSrvc.addLog('invite', null, 'Phone number ' + contactId + ' tried to respond to invite but event wasn\'t found', true);
      });


    })();

    $scope.respondNo = function () {

    };

    $scope.respondYes = function () {

    };
  })
;