/**
 * Add a format(short as f) method to all String objects
 * @type {f}
 */
String.prototype.format = String.prototype.f = function () {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

/**
 * Padding character to string until it reaches given length
 */
String.prototype.leftPad = function (character, totalLength) {
    var s = this;
    while (s.length < totalLength)
        s = character + s;
    return s;
}
