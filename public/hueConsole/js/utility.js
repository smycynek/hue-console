//Functions for color format conversion, number formatting...


//Add leading zeros to string format of a number.
var formatInt = function(intValue, totalSize) {
    "use strict";
    var formattedString = String(intValue);
    while (formattedString.length < totalSize) {
        formattedString = "0" + formattedString;
    }
    return formattedString;
};

//Hue uses Mired for color temperature, but most people are more familiar with Kelvin.
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

//Convert a decimal value between 0 and 1 to an integer 0-255
var colorNormalizedToEightBit = function(value) {
    "use strict";
    return (Math.round(value * 255));
};

//Convert an array of three eight-bit values [0-255] to 24-bit color in a single value
var rbgTripleToSingle = function(rgbTriple) {
    "use strict";
    return (rgbTriple[2] + (rgbTriple[1] * 256) + (rgbTriple[0] * (256 * 256)));
};


//Formulas from Wikipedia - http://en.wikipedia.org/wiki/HSL_and_HSV
var hsbToRgb = function(hue, sat, value) {
    "use strict";
    var satNormal = sat / 255,
        valueNormal = value / 255,
        hueNormal = (hue / 65535) * 360,
        c = valueNormal * satNormal,
        x = c * (1 - Math.abs(((hueNormal / 60) % 2) - 1)),
        m = valueNormal - c,
        red = 0,
        green = 0,
        blue = 0;
    if ((hueNormal >= 0) && (hueNormal < 60)) {
        red = c;
        green = x;
        blue = 0;
    } else if ((hueNormal >= 60) && (hueNormal < 120)) {
        red = x;
        green = c;
        blue = 0;
    } else if ((hueNormal >= 120) && (hueNormal < 180)) {
        red = 0;
        green = c;
        blue = x;
    } else if ((hueNormal >= 180) && (hueNormal < 240)) {
        red = 0;
        green = x;
        blue = c;
    } else if ((hueNormal >= 240) && (hueNormal < 300)) {
        red = x;
        green = 0;
        blue = c;
    } else {
        red = c;
        green = 0;
        blue = x;
    }
    return [colorNormalizedToEightBit(red + m), colorNormalizedToEightBit(green + m), colorNormalizedToEightBit(blue + m)];
};