'use strict';

angular.module('SupAppIonic')

.factory('PhoneSrvc', function($q, $http) {

    function sendMessage(number, text, from) {
        var d = $q.defer();
        var code = encodeURIComponent(text);
        var link = 'https://api.tropo.com/1.0/sessions\?action\=create\&token\=2583fc9bd52af0479a9c0fa3d5e9afd1946c13c8917a1b684cec633c53b9bed8d6a8ca1aec8e688e7edcf48b\&num\=' + number + '\&code\=' + code; // jshint ignore:line

        if (from) {
            link += '&from=' + from;
        }

        console.log(text);

        $http.post(link, null).success(function() {
            d.resolve(text);
        }).error(function(data) {
            d.reject(data);
        });
        return d.promise;
    }

    function sendNumberConfirm(number) {
        var d = $q.defer();
        var code = getRandomInt(1111, 9999);
        var text = 'Your Petri verification code is: ' + code;

        sendMessage(number, text).then(function() {
            d.resolve(code);
        }, function(error) {
            d.resolve(error);
        });

        return d.promise;
    }

    function numberValidator(number) {
        if (!number) {
            return numberOutput(false, null, null, null);
        }

        //strip all non-numeric characters
        var num = number.replace(/\D/g, '');

        //standardize to 11 characters with 1 (no non-us support right now)
        if (num[0] !== '1') {
            num = '1' + num;
        }

        //now walk through some basic validations
        if (num.length !== 11) {
            return numberOutput(false, null, null, 'Please enter a valid 10 digit number');
        } else if (num[1] === '1') {
            return numberOutput(false, null, null, 'Please enter a valid area code');
        } else if (num.substring(2, 4) === '11') {
            return numberOutput(false, null, null, 'Please enter a valid number');
        } else if (num.substring(4, 7) === '555') {
            return numberOutput(false, null, null, 'Nice try');
        } else {
            var displayNum = niceNumberFormatter(num);
            return numberOutput(true, Number(num), displayNum, null);
        }
    }

    function niceNumberFormatter(num) {
        return num.substring(1, 4) + '-' + num.substring(4, 7) + '-' + num.substring(7, 11);
    }

    function numberOutput(valid, realNum, display, errorMessage) {
        return {
            isValid: valid,
            number: realNum,
            displayNumber: display,
            message: errorMessage
        };
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    return {
        sendNumberConfirm: sendNumberConfirm,
        numberValidator: numberValidator,
        niceNumberFormatter: niceNumberFormatter,
        numberOutput: numberOutput,
        sendMessage: sendMessage
    };
});
