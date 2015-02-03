//main Angular app 
var hueNgApp = angular.module("hueNgApp", []);

//Main (and only) angular controller for the body of index.html
hueNgApp.controller("HueCtrl", function ($scope, $window, $http) {
    $scope.debug = false;
    $scope.hueApi = jsHue();
    $scope.hueBridgeIp = "192.168.1.106";
    $scope.hueClientId = "newdeveloper";
    $scope.isDisabled  = true;
    $scope.lightCount = 0;
    $scope.lightList = "";
    $scope.colorTemperature = 4000;
    $scope.brightness = 180;
    $scope.initHue = function() {
           $scope.user = $scope.hueApi.bridge($scope.hueBridgeIp).user($scope.hueClientId);
    }
    
    $scope.formatInt = function(intValue, totalSize) {
        var formattedString = intValue + "";
        while (formattedString.length < totalSize) {
            formattedString = "0" + formattedString;
        };
        return formattedString;
    };

    $scope.reconnect = function() {
        $scope.lightList = ["Initializing..."];
        $scope.updating = "(Updating...)";
        $scope.isDisabled =  true;
        $scope.initHue();
        var calledLights = $scope.getLights();
    };

    $scope.mainControl = function() {
        $scope.reconnect();
    };

    $scope.getCurrentSettings = function() {
        var success = function(data) {
            var brightness = Number(data["state"]["bri"]);
            var ctMired = Number(data["state"]["ct"]);
                  $scope.brightness = brightness;
                  $scope.colorTemperature = miredToKelvin(ctMired);
                  $scope.updating = "";
                  $scope.$apply();
                };
               var failure = function(data) {
               alert("Error getting lighting settings: " + JSON.stringify(data));
               $scope.isDisabled = true;
            };
        $scope.user.getLight(1, success);  //sample settings off light with ID 1 for now.
    }

    $scope.getLights = function() {
        var lightData = [];
        var success = function(data) {
            for(var prop in data) {
                if(data.hasOwnProperty(prop))
                    lightData.push(data[prop].name);
            }
           $scope.lightList = lightData;
           $scope.lightCount = lightData.length;
           $scope.isDisabled = false;
           $scope.$apply();
           $scope.getCurrentSettings();
        };

        var failure = function(data) {
            $scope.lightCount = -1;
            $scope.lightList = ["Error getting light data: ", JSON.stringify(data)];
            $scope.isDisabled = true;
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


    $scope.setCustomTemperature = function(kelvinValue) {
      var mired = kelvinToMired(kelvinValue);
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

    $scope.setBrightness = function(val) {
         $scope.brightness = val;
         $scope.setAll($scope.user, {bri:$scope.brightness}, $scope.lightCount);
    };
});

//Extra directive to create an html range input that binds its value to an angular scope variable.
//(Needed only for IE -- other browers do it natively)
hueNgApp.directive("rangetemp", function () { 
    return {
        restrict: "E",
        template: '<input id ="tempRange"  ng-disabled="isDisabled" type="range" title="Change color temperature" min="2000" max="6500" value="4000" ng-model="colorTemperature" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.colorTemperature = rangeControl.val();
                    scope.setCustomTemperature(scope.colorTemperature);
                    });
                });
            }
        };
    });


hueNgApp.directive("rangebright", function () { 
    return {
        restrict: "E",
        template: '<input id="brightnessRange" ng-disabled="isDisabled" type="range" title="Change brightness" min="0" max="255" value="180" ng-model="brightness" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.brightness= Math.round(rangeControl.val());
                    scope.setBrightness(scope.brightness);
                    });
                });
            }
        };
    });


var kelvinToMired = function(kelvin) {
    var mired = 1000000/kelvin;
    if (mired > 500)
       mired = 500;
    if (mired < 153)
       mired = 153; 
    return Math.floor(mired);
};

var miredToKelvin = function(mired) {
    var kelvin = 1000000/mired;
    if (kelvin > 6500)
       kelvin = 6500;
    if (kelvin < 2000)
       kelvin = 2000; 
    return Math.floor(kelvin);
};


