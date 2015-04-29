'use strict';
/* global Firebase */

angular.module('SupAppIonic')
    .controller('OnboardingCtrl', function($scope, $rootScope, $location, $firebaseSimpleLogin, $timeout, UserSrvc, ContactSrvc, PhoneSrvc, TrackingSrvc) {

        var dataRef = new Firebase('https://petri.firebaseio.com');
        var userNumber;
        var steps = [{
            num: 0,
            title: 'Launching'
        }, {
            num: 1,
            title: 'Verify Phone #'
        }, {
            num: 2,
            title: 'Verify Phone #'
        }, {
            num: 3,
            title: 'Find Friends'
        }, {
            num: 4,
            title: 'Complete Profile'
        }, {
            num: 5
        }];

        $scope.step = steps[0];
        $scope.confirmCode = {
            loading: false,
            sent: false,
            code: null,
            error: null
        };
        $scope.currentUser = {};
        $scope.startProgressBar = false;
        $scope.loginObj = $firebaseSimpleLogin(dataRef);
        $scope.user = $scope.loginObj.$getCurrentUser();

        // LAME WAY TO INIT THE APP HERE
        $rootScope.$on('userDefined', function(event, user) {
            var status = user && user.registered || $scope.user && $scope.user.registered || false;

            if (status === true) {
                $location.url('/events');
            } else if (status === 'addTel') {
                $scope.step = steps[1];
            } else if (status === 'addContacts') {
                $scope.step = steps[3];
            } else if ($scope.status === 'saveName') {
                $scope.step = steps[4];
            } else {
                $scope.step = steps[1];
            }
        });

        $scope.goToStep = function(stepNum) {
            $scope.step = steps[stepNum];
        };

        $scope.validTel = function(number) {
            var validObj = PhoneSrvc.numberValidator(number);
            return validObj.isValid;
        };

        $scope.sendConfirm = function(number) {
            var validObj = PhoneSrvc.numberValidator(number);
            userNumber = validObj.number;
            $scope.confirmCode.loading = true;
            PhoneSrvc.sendNumberConfirm(userNumber).then(function(result) {
                $scope.confirmCode.sent = true;
                $scope.confirmCode.loading = false;
                $scope.confirmCode.code = result;
                $scope.step = steps[2];
                UserSrvc.userOnRegistrationStep('addTel');
            }, function() {
                $scope.confirmCode.loading = false;
                $scope.confirmCode.error = 'Sorry, there was an error sending your confirmation code. Please try again.';
            });
        };

        $scope.addTel = function(code) {
            if (Number(code) === Number($scope.confirmCode.code)) {

                ContactSrvc.globalNumberVerified(userNumber);

                UserSrvc.saveCurrentUserData({
                    contactId: userNumber
                }).then(function() {
                    $scope.step = steps[3];
                    UserSrvc.userOnRegistrationStep('addContacts');
                }, function(error) {
                    console.log(error);
                });
            } else {
                $scope.confirmCode.error = 'Sorry, that code doesn\'t match what we sent. Please try again.';
            }
        };

        $scope.addContacts = function() {

            $scope.step = steps[5];

            userNumber = userNumber || UserSrvc.currentUser.contactId;

            // This is pretty dangerous, but to optimize the experience right now I'm just
            // allowing this 20 seconds, continuing, and allowing the upload to proceed in the
            // background
            $timeout(continueToLastStep, 20000);
            $timeout(startThing, 200);

            ContactSrvc.bulkUpdateContactsFromDevice(userNumber).then(function() {
                $scope.currentUser = UserSrvc.getUserLocally();
                console.log('Finished contact processing');
                $timeout.cancel();
                continueToLastStep();
            }, function(error) {
                console.log(error);
            });
        };

        $scope.saveName = function() {
            var saveData = {
                firstName: $scope.currentUser.firstName,
                lastName: $scope.currentUser.lastName
            };

            UserSrvc.saveUserData($scope.currentUser.id, saveData).then(function() {
                $location.url('/events');
                UserSrvc.userRegistrationComplete();
                TrackingSrvc.registered(userNumber);
            }, function(error) {
                console.log(error);
            });
        };

        function startThing() {
            $scope.startProgressBar = true;
        }

        function continueToLastStep() {
            $scope.step = steps[4];
            UserSrvc.userOnRegistrationStep('saveName');
        }
    });
