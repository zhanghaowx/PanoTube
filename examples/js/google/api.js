GOOGLE = {};
GOOGLE.API_KEY = "AIzaSyBIF1-Js6XooDnDjbtI7MNdWmI8okuCZF8";

GOOGLE.Panorama = {};
GOOGLE.Panorama.SERVER_URL = "https://maps.googleapis.com/maps/api/streetview";
GOOGLE.Panorama.DIMENSIONS = "512x512";

/**
 * This function generates a list of GOOGLE street level image URLs based on passed in resolution level.
 * It returns an order of tile paths as following:
 */
GOOGLE.Panorama.getImageUrls = function (latitude, longitude) {
    var urls = [];
    for (var face = 0; face < 6; face++) {
        urls.push("{0}?size={1}&location={2},{3}&heading={4}&pitch={5}&fov={6}&key={7}".format(
            GOOGLE.Panorama.SERVER_URL,
            GOOGLE.Panorama.DIMENSIONS,
            latitude,
            longitude,
            GOOGLE.Panorama.getHeading(face),
            GOOGLE.Panorama.getPitch(face),
            90.0,
            GOOGLE.API_KEY
        ));
    }

    return urls;
}

/**
 * @param  {Number} face face index in {FRONT=0, RIGHT=1, BACK=2, LEFT=3, BOTTOM=4, TOP=5}
 * @return {Number}      Heading value for each face
 */
GOOGLE.Panorama.getHeading = function (face) {
    switch (face) {
    case 4:
    case 5:
        return 0;
    default:
        return 90.0 * face;
    }
};

/**
 * @param  {Number} face face index in {FRONT=0, RIGHT=1, BACK=2, LEFT=3, BOTTOM=4, TOP=5}
 * @return {Number}      Pitch value for each face
 */
GOOGLE.Panorama.getPitch = function (face) {
    switch (face) {
    case 4:
        return -90;
    case 5:
        return 90;
    default:
        return 0;
    }
};
