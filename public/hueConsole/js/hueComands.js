/*global alert */
/*global confirm */
/*global angular */
/*global jsHue */


var kelvinToMired = function(kelvin) {
    "use strict";
    var mired = 1000000 / kelvin;
    if (mired > 500) {
        mired = 500;
    }
    if (mired < 153) {
        mired = 153;
    }
    return Math.floor(mired);
};

var miredToKelvin = function(mired) {
    "use strict";
    var kelvin = 1000000 / mired;
    if (kelvin > 6500) {
        kelvin = 6500;
    }
    if (kelvin < 2000) {
        kelvin = 2000;
    }
    return Math.floor(kelvin);
};



//main Angular app 
var hueNgApp = angular.module("hueNgApp", []);

//Main (and only) angular controller for the body of index.html
hueNgApp.controller("HueCtrl", function($scope) {
    "use strict";
    $scope.debug = false;
    $scope.hueApi = jsHue();
    $scope.color = 0;
    $scope.debugHexColor = "#0f0";
    $scope.hueBridgeIp = "localhost";
    $scope.hueClientId = "newdeveloper";
    $scope.isDisabled = true;
    $scope.lightCount = 0;
    $scope.lightList = ["Not connected..."];
    $scope.colorTemperature = 4000;
    $scope.brightness = 180;
    $scope.hueValue = 0;
    $scope.saturation = 128;
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

    $scope.setColor = function() {
        var hexColor = $scope.formatInt($scope.color.toString(16), 6);
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
        $scope.apply();
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
    };

    $scope.setTemperatureDirty = function() {
        $scope.hueSaturationDirtyState = $scope.currentValueStyle;
        $scope.temperatureDirtyState = $scope.dirtyValueStyle;
    };

    $scope.setHueSaturationDirty = function() {
        $scope.temperatureDirtyState = $scope.currentValueStyle;
        $scope.hueSaturationDirtyState = $scope.dirtyValueStyle;
    };

    $scope.setHue = function(val) {
        $scope.hueValue = val;
        $scope.setAll($scope.user, {
            hue: $scope.hueValue
        }, $scope.lightCount);
        $scope.setTemperatureDirty();

    };

    $scope.setSaturation = function(val) {
        $scope.saturation = val;
        $scope.setAll($scope.user, {
            sat: $scope.saturation
        }, $scope.lightCount);
        $scope.setTemperatureDirty();
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
        }
    };
});

hueNgApp.directive("rangehue", function() {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="saturationHue" ng-disabled="isDisabled" type="range" title="Change hue" min="0" max="65535" value="0" ng-model="hueValue" style="width:50px; display:inline"/>',
        link: function(scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function() {
                scope.$apply(function() {
                    scope.hueValue = Math.round(rangeControl.val());
                    scope.setHue(scope.hueValue);
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
        }
    };
});

hueNgApp.directive("colorpreview", function() {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="colorPreview" type="range" title="Change color" min="0" max="16777215" value="0" ng-model="color" style="width:100px; display:inline"/>',
        link: function(scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("input", function() {
                scope.$apply(function() {
                    scope.color = Math.round(rangeControl.val());
                    scope.setColor(scope.color);
                });
            });
        }
    };
});