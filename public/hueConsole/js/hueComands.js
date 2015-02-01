//main Angular app 
var hueNgApp = angular.module("hueNgApp", []);

var kelvinToMired = function(kelvin) {
    var mired = 1000000/kelvin;
    if (mired > 500)
       mired = 500;
    if (mired < 153)
       mired = 153; 
    return Math.floor(mired);
};

//Main (and only) angular controller for the body of index.html
hueNgApp.controller("hueCtrl", function ($scope, $window, $http) {
    $scope.debug = false;
    $scope.fadeSpeed = 0;
    $scope.hueApi = jsHue();
    $scope.hueBridgeIp = "192.168.1.106";
    $scope.hueClientId = "newdeveloper";
    //$scope.user = $scope.hueApi.bridge($scope.hueBridgeIp).user($scope.hueClientId);
    $scope.lightCount = 0;
    $scope.lightList = "";
    $scope.colorTemperature = 4000;
    $scope.brightness = 120;
    $scope.initHue = function() {
           $scope.user = $scope.hueApi.bridge($scope.hueBridgeIp).user($scope.hueClientId);
    }
    
    $scope.reconnect = function() {
        $scope.lightList = "Initializing...";
        $scope.initHue();
        var calledLights = $scope.getLights();
       // alert("calledLights? " + calledLights);
    };

    $scope.mainControl = function() {
        $scope.reconnect();
    };

    $scope.getLights = function() {
        var lightData = [];
        var success = function(data) {
            for(var prop in data) {
                if(data.hasOwnProperty(prop))
                    lightData.push(data[prop].name);
            }
           $scope.lightList = lightData;
           $scope.lightCount = lightData.length;
           $scope.$apply();
        };

        var failure = function(data) {
            $scope.lightCount = -1;
            $scope.lightList = JSON.stringify(data);
        };

        var calledLights = $scope.user.getLights(success, failure);
        return calledLights;
   };

   $scope.setAll = function(client, data, totalLights) {
     for (var id=1; id != totalLights+1; id++) {
        client.setLightState(id ,data);
        }
    };

    $scope.setOnOff = function(state) {
        $scope.setAll($scope.user, {on: state}, $scope.lightCount);
    };


    $scope.setCustomTemperature = function() {
      var mired = kelvinToMired($scope.colorTemperature);
        $scope.setAll($scope.user, {ct:mired}, $scope.lightCount);
    };

    $scope.setRed = function() {
        $scope.setAll($scope.user, {hue:0, sat:255}, $scope.lightCount);
    };

    $scope.setBlue = function() {
        $scope.setAll($scope.user, {hue:46920, sat:255}, $scope.lightCount);
    };

    $scope.setGreen= function() {
        $scope.setAll($scope.user, {hue:25500, sat:255}, $scope.lightCount);
    };

    $scope.setDim = function() {
        $scope.setAll($scope.user, {bri:10}, $scope.lightCount);
    };

    $scope.setBright = function() {
        $scope.setAll($scope.user, {bri:255}, $scope.lightCount);
    };
});

//Extra directive to create an html range input that binds its value to an angular scope variable.
//(Needed only for IE -- other browers do it natively)
hueNgApp.directive("range", function () {
    return {
        restrict: "E",
        template: '<input type="range" title="Change color temperature" min="2000" max="6500" value="4000" ng-model="colorTemperature" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.colorTemperature = rangeControl.val();
                    scope.setCustomTemperature();
                    });
                });
            }
        };
    });



