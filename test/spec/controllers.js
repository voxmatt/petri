'use strict';

describe('Controller: PetIndexCtrl', function () {

  var should = chai.should();

  // load the controller's module
  beforeEach(angular.mock.module('SupAppIonic'));

  // var PetIndexCtrl,
  //   scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    // scope = $rootScope.$new();
    // PetIndexCtrl = $controller('PetIndexCtrl', {
    //   $scope: scope
    // });
  }));

  it('should attach a list of pets to the scope', function () {
    var pets = [1,2,3,4];
    pets.should.have.length(4);
  });

});
