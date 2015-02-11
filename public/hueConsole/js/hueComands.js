/*global alert */
/*global confirm */
/*global angular */
/*global jsHue */
/*global kelvinToMired */
/*global miredToKelvin */
/*global hsbToRgb */



//main Angular app 
var hueNgApp = angular.module("hueNgApp", []);

//Main (and only) angular controller for the body of index.html
hueNgApp.controller("HueCtrl", function($scope) {
    "use strict";
    $scope.debug = false;
    $scope.hueApi = jsHue();
    $scope.previewColor = 0;
    $scope.debugHexColor = "#000";
    $scope.previewStrikeout = "";
    $scope.hueBridgeIp = "localhost";
    $scope.hueClientId = "newdeveloper";
    $scope.isDisabled = true;
    $scope.lightCount = 0;
    $scope.lightList = ["Not connected..."];
    $scope.colorTemperature = 4000;
    $scope.brightness = 255;
    $scope.hueValue = 0;
    $scope.saturation = 255;
    $scope.currentValueStyle = "color:black;text-decoration:unset";
    $scope.dirtyValueStyle = "color:red;text-decoration:line-through";
    $scope.temperatureDirtyState = $scope.currentValueStyle;
    $scope.hueSaturationDirtyState = $scope.currentValueStyle;
    $scope.debugAlert = function(caption, data) {
        if ($scope.debug) {
            alert("Debug: " + caption + " Data: " + JSON.stringify(data));
        }
    };

    $scope.findBridge = function() {
        var errMessage = "Could not find hue bridge: Try:  \n1) Setting IP manually\n2) Use 'localhost' \n3) See Hue developer documentation.\n",
            success = function(data) {
                try {
                    $scope.debugAlert("findBridge", data);
                    var ip = data[0].internalipaddress;

                    if (confirm("Found bridge IP " + ip + ".  Use to connect?")) {
                        $scope.hueBridgeIp = ip;
                        $scope.$apply();
                        $scope.reconnect();
                    } else {
                        return;
                    }
                } catch (err) {
                    alert(errMessage + ", Error Data: " + JSON.stringify(err));
                }
            },
            failure = function(data) {
                alert(errMessage + ", Error Data: " + JSON.stringify(data));
            };
        $scope.hueApi.discover(success, failure);

    };

    $scope.initHue = function() {
        $scope.user = $scope.hueApi.bridge($scope.hueBridgeIp).user($scope.hueClientId);
    };

    $scope.getFormattedLightList = function() {
        return $scope.lightList.join(", ");
    };


///

    $scope.clearPreviewStrikeout = function() {
        $scope.previewStrikeout = "";
    };

    $scope.clearPreviewColor = function () {
        $scope.previewColor = 0;
        $scope.debugHexColor = "#ffffff";
        $scope.previewStrikeout = "background: repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,0,0,1) 10px, transparent 8px);";
    };

    $scope.setTemperatureDirty = function() {
        $scope.hueSaturationDirtyState = $scope.currentValueStyle;
        $scope.temperatureDirtyState = $scope.dirtyValueStyle;
        $scope.clearPreviewStrikeout();
    };

    $scope.setHueSaturationDirty = function() {
        $scope.temperatureDirtyState = $scope.currentValueStyle;
        $scope.hueSaturationDirtyState = $scope.dirtyValueStyle;
        $scope.clearPreviewColor();
    };


    $scope.setPreviewColor = function() {
        var color = hsbToRgb($scope.hueValue, $scope.saturation, $scope.brightness);
        $scope.previewColor = color[2] + color[1] * 256 + color[0] * (256 * 256);
        var hexColor = $scope.formatInt($scope.previewColor.toString(16), 6);
        $scope.debugHexColor = "#" + hexColor;
    };

    $scope.formatInt = function(intValue, totalSize) {
        var formattedString = String(intValue);
        while (formattedString.length < totalSize) {
            formattedString = "0" + formattedString;
        }
        return formattedString;
    };

    $scope.reconnect = function() {
        $scope.lightList = ["Initializing..."];
        $scope.$apply();
        $scope.updating = "(Updating...)";
        $scope.isDisabled = true;
        $scope.initHue();
        $scope.getLights();
    };

    $scope.mainControl = function() {
        $scope.debugAlert("mainControl", "Debug mode: " + $scope.debug);
        $scope.findBridge();
    };

    $scope.getCurrentSettings = function() {
        var success = function(data) {
            $scope.debugAlert("getCurrentSettings", data);
            var brightness = Number(data.state.bri),
                ctMired = Number(data.state.ct),
                hue = Number(data.state.hue),
                sat = Number(data.state.sat);
            $scope.brightness = brightness;
            $scope.colorTemperature = miredToKelvin(ctMired);
            $scope.hueValue = hue;
            $scope.saturation = sat;
            $scope.updating = "";
            $scope.setPreviewColor();
            $scope.setTemperatureDirty();
            $scope.$apply();
        },
            failure = function(data) {
                alert("Error getting lighting settings: " + JSON.stringify(data));
                $scope.isDisabled = true;
            };
        $scope.user.getLight(1, success, failure); //sample settings off light with ID 1 for now.
    };

    $scope.getLights = function() {
        var lightData = [],
            success = function(data) {
                $scope.debugAlert("getLights", data);
                var prop;
                for (prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        lightData.push(data[prop].name);
                    }
                }
                $scope.lightList = lightData;
                $scope.lightCount = lightData.length;
                $scope.isDisabled = false;
                $scope.$apply();
                $scope.getCurrentSettings();
                $scope.setPreviewColor();
            },
            failure = function(data) {
                $scope.lightCount = -1;
                $scope.lightList = ["Error getting light data: ", JSON.stringify(data)];
                $scope.isDisabled = true;
            },
            calledLights = $scope.user.getLights(success, failure);
        return calledLights;
    };

    $scope.setAll = function(client, data, totalLights) {
        var id, success = function(data) {
            $scope.debugAlert("setAll", data);
           // $scope.setPreviewColor();
        }, failure = function(data) {
            alert("Error setting lights: " + JSON.stringify(data));
        };
        for (id = 1; id !== totalLights + 1; id = id + 1) {
            client.setLightState(id, data, success, failure);
        }
    };

    $scope.setOnOff = function(state) {
        $scope.setAll($scope.user, {
            on: state
        }, $scope.lightCount);
    };

    $scope.setCustomTemperature = function(kelvinValue) {
        var mired = kelvinToMired(kelvinValue);
        $scope.setAll($scope.user, {
            ct: mired
        }, $scope.lightCount);
        $scope.setHueSaturationDirty();
         //$scope.setPreviewColor();
       // $scope.$apply();
    };

    $scope.setRed = function() {
        $scope.setHue(0);
    };

    $scope.setBlue = function() {
        $scope.setHue(46920);
    };

    $scope.setGreen = function() {
        $scope.setHue(25500);
    };

    $scope.setBrightness = function(val) {
        $scope.brightness = val;
        $scope.setAll($scope.user, {
            bri: $scope.brightness
        }, $scope.lightCount);
        $scope.setPreviewColor();
    };



    $scope.setHue = function(val) {
        $scope.hueValue = val;
        $scope.setAll($scope.user, {
            hue: $scope.hueValue
        }, $scope.lightCount);
        $scope.setTemperatureDirty();
        $scope.setPreviewColor();
    };

    $scope.setSaturation = function(val) {
        $scope.saturation = val;
        $scope.setAll($scope.user, {
            sat: $scope.saturation
        }, $scope.lightCount);
        $scope.setTemperatureDirty();
        $scope.setPreviewColor();
    };
});

//Extra directive to create an html range input that binds its value to an angular scope variable.
//(Needed only for IE -- other browers do it natively)
hueNgApp.directive("rangetemp", function() {
    "use strict";
    return {
        restrict: "E",
        template: '<input id ="tempRange" ng-disabled="isDisabled" type="range" title="Change color temperature" min="2000" max="6500" value="4000" ng-model="colorTemperature" style="width:100px; display:inline"/>',
        link: function(scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function() {
                scope.$apply(function() {
                    scope.colorTemperature = rangeControl.val();
                    scope.setCustomTemperature(scope.colorTemperature);
                });
            });

            rangeControl.bind("input", function() {
                scope.$apply(function() {
                    scope.colorTemperature = Math.round(rangeControl.val());
                    scope.setHueSaturationDirty();
                });
            });
        }
    };
});

hueNgApp.directive("rangesaturation", function() {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="saturationRange" ng-disabled="isDisabled" type="range" title="Change brightness" min="0" max="255" value="180" ng-model="saturation" style="width:100px; display:inline"/>',
        link: function(scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function() {
                scope.$apply(function() {
                    scope.saturation = Math.round(rangeControl.val());
                    scope.setSaturation(scope.saturation);
                });
            });

            rangeControl.bind("input", function() {
                scope.$apply(function() {
                    scope.saturation = Math.round(rangeControl.val());
                    scope.setSaturation(scope.saturation);
                    scope.setTemperatureDirty();
                    scope.setPreviewColor();
                });
            });
        }
    };
});

hueNgApp.directive("rangehue", function() {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="saturationHue" ng-disabled="isDisabled" type="range" title="Change hue" min="0" max="65535" value="0" ng-model="hueValue" style="width:100px; display:inline"/>',
        link: function(scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function() {
                scope.$apply(function() {
                    scope.hueValue = Math.round(rangeControl.val());
                    scope.setHue(scope.hueValue);
                });
            });

            rangeControl.bind("input", function() {
                scope.$apply(function() {
                    scope.hueValue = Math.round(rangeControl.val());
                    scope.setTemperatureDirty();
                    scope.setPreviewColor();
                });
            });
        }
    };
});

hueNgApp.directive("rangebright", function() {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="brightnessRange" ng-disabled="isDisabled" type="range" title="Change brightness" min="0" max="255" value="180" ng-model="brightness" style="width:100px; display:inline"/>',
        link: function(scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function() {
                scope.$apply(function() {
                    scope.brightness = Math.round(rangeControl.val());
                    scope.setBrightness(scope.brightness);
                });
            });

            rangeControl.bind("input", function() {
                scope.$apply(function() {
                    scope.brightness = Math.round(rangeControl.val());
                    scope.setBrightness(scope.brightness);
                    scope.setPreviewColor();
                });
            });

        }
    };
});

