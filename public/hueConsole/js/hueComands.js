/**
 * hue-console
 * Simple web-console for Philips Hue using John Peloquin's JsHue library
 *
 * version 0.3.1
 * Copyright 2014-2017 Steven Mycynek
 */

/*global alert */
/*global confirm */
/*global angular */
/*global jsHue */
/*global kelvinToMired */
/*global miredToKelvin */
/*global hsbToRgb */
/*global rbgTripleToSingle */
/*global formatInt */
/*global navigator */

//main Angular app
var hueNgApp = angular.module("hueNgApp", ["ngCookies"]);

//Main angular controller for the body of index.html
hueNgApp.controller("HueCtrl", function ($scope, $cookies) {
    "use strict";
    $scope.debug = false;
    $scope.hueApi = jsHue();
    $scope.previewHexColor = "#000";
    $scope.previewStrikeoutStyle = "";
    $scope.hueBridgeIp = "localhost";
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
    $scope.cookieNameAppId = "net.stevenvictor.hueConsole.hueAppId6";
    $scope.cookieNameBridgeIP = "net.stevenvictor.hueConsole.hueBridgeIP";
    $scope.cookieLife = "Fri, 28-Feb-2020 00:00:00 GMT";

    $scope.cookiesEnabled = function () {
        return navigator.cookieEnabled;
    };


    $scope.getHueIdCookie = function () {
        var cookie = $cookies.get($scope.cookieNameAppId);
        if (cookie === undefined) {
            return "click 'register' button -->";
        } else {
            return cookie;
        }
    };

    $scope.setHueIdCookie = function (hueId) {
        $cookies.put($scope.cookieNameAppId, hueId, {"expires": $scope.cookieLife});
    };

    $scope.hueClientId = $scope.getHueIdCookie();

    $scope.getHueBridgeIP = function () {
        var cookie = $cookies.get($scope.cookieNameBridgeIP);
        if (cookie === undefined) {
            return "localhost";
        } else {
            return cookie;
        }
    };

    $scope.setHueBridgeIP = function (hueIP) {
        $cookies.put($scope.cookieNameBridgeIP, hueIP, {"expires": $scope.cookieLife});
    };

    $scope.hueBridgeIp = $scope.getHueBridgeIP();



    $scope.debugAlert = function (caption, data) {
        if ($scope.debug) {
            alert("Debug: " + caption + " Data: " + JSON.stringify(data));
        }
    };

    //Add leading zeros to string format of a number.
    $scope.formatInt = function (intValue, totalSize) {
        var formattedString = String(intValue);
        while (formattedString.length < totalSize) {
            formattedString = "0" + formattedString;
        }
        return formattedString;
    };

    //Must be called before any other hue apis.
    $scope.initHue = function () {
        $scope.user = $scope.hueApi.bridge($scope.hueBridgeIp).user($scope.hueClientId);
    };

    //Attempt to find the hue bridge on the local network and display all found lights and settings.
    $scope.findBridge = function () {
        var errMessage = "Could not find hue bridge: Try:  \n1) Setting IP manually\n2) Use 'localhost' \n3) See Hue developer documentation.\n",
            success = function (data) {
                try {
                    $scope.debugAlert("findBridge", data);
                    var ip;
                    ip = data[0].internalipaddress;
                  
                    if (confirm("Found bridge IP " + ip + ".  Use to connect?")) {
                        $scope.hueBridgeIp = ip;
                        $scope.setHueBridgeIP(ip);
                        $scope.$apply();
                        $scope.reconnect();
                    } else {
                        return;
                    }
                } catch (err) {
                    alert(errMessage + ", Error Data: " + JSON.stringify(err));
                }
            },
            failure = function (data) {
                alert(errMessage + ", Error Data: " + JSON.stringify(data));
            };
        $scope.hueApi.discover(success, failure);

    };

    $scope.loadStoredBridge = function () {
        var storedIP = $scope.getHueBridgeIP();
        if (storedIP === "localhost") {
            return false;
        }
        else {
              $scope.hueBridgeIp = storedIP;
              $scope.reconnect();
              $scope.$apply();

              return true;
        }

    };

    $scope.registerApp = function () {
        var success = function (data) {
                if ((typeof data[0].error) !== 'undefined') {
                    alert("Error: " + data[0].error.description);
                } else {
                    alert("Application registered: " + data[0].success.username);
                    $scope.hueClientId = data[0].success.username;
                    $scope.setHueIdCookie($scope.hueClientId);
                    $scope.reconnect();
                    $scope.$apply();
                }
            },
            failure = function (data) {
                alert("Failure calling user.create(): " + JSON.stringify(data));
            };

        $scope.initHue();
        alert("Press the 'link' button on your hue bridge and click 'OK.'");
        $scope.user.create("HueConsole", success, failure);

    };
    //Display all available light names as a simple comma-delimited list.
    $scope.getFormattedLightList = function () {
        return $scope.lightList.join(", ");
    };

    //Set the preview rectangle to a red-strikethrough pattern to indicate that a preview cannot currently be
    //generated.
    $scope.setPreviewStrikoutStyle = function () {
        var background = "45deg, #ff0000, #ff0000 5px, transparent 5px, transparent 10px";
        $scope.previewStrikeoutStyle = "background: repeating-linear-gradient(" + background + ");";
    };

    //Remove the red strikethrough pattern from the preview rectangle.
    $scope.clearPreviewStrikeoutStyle = function () {
        $scope.previewStrikeoutStyle = "";
    };

    //Set background color of preview rectangle to match selected hue, saturation, and brightness.
    //Note that the conversion is sometimes non-intuitive, and the Hue lights can't represent all colors
    //equally well.
    $scope.setPreviewColor = function () {
        var colorTriple = hsbToRgb($scope.hueValue, $scope.saturation, $scope.brightness);
        $scope.previewHexColor = "#" + $scope.formatInt(rbgTripleToSingle(colorTriple).toString(16), 6);
    };

    //Display color temperature in strikout if the values currently don't apply.
    $scope.setTemperatureDirty = function () {
        $scope.hueSaturationDirtyState = $scope.currentValueStyle;
        $scope.temperatureDirtyState = $scope.dirtyValueStyle;
        $scope.clearPreviewStrikeoutStyle();
    };

    //Display hue and saturation in strikout if the values currently don't apply.
    $scope.setHueSaturationDirty = function () {
        $scope.temperatureDirtyState = $scope.currentValueStyle;
        $scope.hueSaturationDirtyState = $scope.dirtyValueStyle;
        $scope.setPreviewStrikoutStyle();
    };

    //Reinitialize hue--typically not needed after startup.
    $scope.reconnect = function () {
        $scope.lightList = ["Initializing..."];
        //$scope.$apply();
        $scope.updating = "(Updating...)";
        $scope.isDisabled = true;
        $scope.initHue();
        $scope.getLights();
    };

    //Called when page loads
    $scope.mainControl = function () {
        $scope.debugAlert("mainControl", "Debug mode: " + $scope.debug);
        if ($scope.loadStoredBridge() === false) {
            $scope.findBridge();
        }
    };

    //Query the state of a light and the adjust hue, saturation, and brightness controls
    //to match it.
    $scope.syncUIwithLight = function (data) {
        $scope.debugAlert("syncUIwithLight", data);
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
    };


    //Query hue for all available lights, display them on the page, and sync hue/sat/brightness values
    //to match Light "1"
    $scope.getLights = function () {
        var lightData = [],
            success = function (data) {
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
                $scope.syncUIwithLight(data[1]);
                $scope.setPreviewColor();
            },
            failure = function (data) {
                $scope.lightCount = -1;
                $scope.lightList = ["Error getting light data: ", JSON.stringify(data)];
                $scope.isDisabled = true;
            },
            calledLights = $scope.user.getLights(success, failure);
        return calledLights;
    };

    //Apply a setting to all lights.
    $scope.setAll = function (client, data, totalLights) {
        var id, success = function (data) {
            $scope.debugAlert("setAll", data);
        },
                failure = function (data) {
            alert("Error setting lights: " + JSON.stringify(data));
        };
        for (id = 1; id !== totalLights + 1; id = id + 1) {
            client.setLightState(id, data, success, failure);
        }
    };

    //Turn all lights on or off
    $scope.setOnOff = function (state) {
        $scope.setAll($scope.user, {
            on: state
        }, $scope.lightCount);
    };

    //Set color temperature.
    $scope.setColorTemperature = function (kelvinValue) {
        var mired = kelvinToMired(kelvinValue);
        $scope.setAll($scope.user, {
            ct: mired
        }, $scope.lightCount);
    };
    //Set brightness (0-255)
    $scope.setBrightness = function (val) {
        $scope.brightness = val;
        $scope.setAll($scope.user, {
            bri: $scope.brightness
        }, $scope.lightCount);
        $scope.setPreviewColor();
    };

    //Set hue (0-65535)
    $scope.setHue = function (val) {
        $scope.hueValue = val;
        $scope.setAll($scope.user, {
            hue: $scope.hueValue
        }, $scope.lightCount);
    };

    //Set saturation (0-255)
    $scope.setSaturation = function (val) {
        $scope.saturation = val;
        $scope.setAll($scope.user, {
            sat: $scope.saturation
        }, $scope.lightCount);
    };
});

//Extra directive to create an html range input that binds its value to an angular scope variable.
//(Needed only for IE -- other browers do it natively)

//Note that only preview settings are set on "input" (drag), but the hue lights actually change only on
//"change" (mouse-button release)
hueNgApp.directive("rangetemp", function () {
    "use strict";
    return {
        restrict: "E",
        template: '<input id ="tempRange" ng-disabled="isDisabled" type="range" title="Change color temperature" min="2000" max="6500" value="4000" ng-model="colorTemperature" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.colorTemperature = rangeControl.val();
                    scope.setColorTemperature(scope.colorTemperature);
                });
            });

            rangeControl.bind("input", function () {
                scope.$apply(function () {
                    scope.colorTemperature = Math.round(rangeControl.val());
                    scope.setHueSaturationDirty();
                });
            });
        }
    };
});

hueNgApp.directive("rangesaturation", function () {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="saturationRange" ng-disabled="isDisabled" type="range" title="Change brightness" min="0" max="255" value="180" ng-model="saturation" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.saturation = Math.round(rangeControl.val());
                    scope.setSaturation(scope.saturation);
                });
            });

            rangeControl.bind("input", function () {
                scope.$apply(function () {
                    scope.saturation = Math.round(rangeControl.val());
                    scope.setTemperatureDirty();
                    scope.setPreviewColor();
                });
            });
        }
    };
});

hueNgApp.directive("rangehue", function () {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="saturationHue" ng-disabled="isDisabled" type="range" title="Change hue" min="0" max="65535" value="0" ng-model="hueValue" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.hueValue = Math.round(rangeControl.val());
                    scope.setHue(scope.hueValue);
                });
            });

            rangeControl.bind("input", function () {
                scope.$apply(function () {
                    scope.hueValue = Math.round(rangeControl.val());
                    scope.setTemperatureDirty();
                    scope.setPreviewColor();
                });
            });
        }
    };
});

hueNgApp.directive("rangebright", function () {
    "use strict";
    return {
        restrict: "E",
        template: '<input id="brightnessRange" ng-disabled="isDisabled" type="range" title="Change brightness" min="0" max="255" value="180" ng-model="brightness" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.brightness = Math.round(rangeControl.val());
                    scope.setBrightness(scope.brightness);
                });
            });

            rangeControl.bind("input", function () {
                scope.$apply(function () {
                    scope.brightness = Math.round(rangeControl.val());
                    scope.setPreviewColor();
                });
            });

        }
    };
});