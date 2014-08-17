'use strict';

angular.module('SupAppIonic')

	.factory('PhoneSrvc', function() {
		
		function numberValidator(number) {
			if (!number){
				return numberOutput(false, null, null, null);
			}

			//strip all non-numeric characters
			var num = number.replace(/\D/g,'');

			//standardize to 11 characters with 1 (no non-us support right now)
			if (num[0] !== '1'){
				num = '1' + num;
			}

			//now walk through some basic validations
			if (num.length !== 11){
				return numberOutput(false, null, null, 'Please enter a valid 10 digit number');
			} else if (num[1] === '1') {
				return numberOutput(false, null, null, 'Please enter a valid area code');
			} else if (num.substring(2,4) === '11') {
				return numberOutput(false, null, null, 'Please enter a valid number');
			} else if (num.substring(4,7) === '555') {
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
			return { isValid: valid, number: realNum, displayNumber: display, message: errorMessage };
		}

		return {
			numberValidator: numberValidator,
			niceNumberFormatter: niceNumberFormatter,
			numberOutput: numberOutput
		};
	})
;