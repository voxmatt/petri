'use strict';

angular.module('SupAppIonic')
	.directive('loading', function () {
		return {
			restrict: 'A',
			scope: {
				isLoading: '=loading'
			},
			replace: true,
			transclude: true,
			templateUrl: 'views/loading-drtv.html',
			controller: function () {
			}
		};
	})
;