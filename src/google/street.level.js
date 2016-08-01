/**
 * This file provides util functions for Google Street Level API
 */
define([
    "google/api",
    "core/String"
], function () {

    GOOGLE.Panorama.SERVER_URL = "https://geo2.ggpht.com/cbk";

    GOOGLE.Panorama.IMAGES_PER_DIMENSION = [1, 2, 4, 8];

    /**
     * This function generates a list of HERE street level image URLs based on passed in resolution level.
     * Zoom == 2 is Regular Tetrahedron?
     */
    GOOGLE.Panorama.getImageUrls = function (imageId, resolution) {
        var urls = [];

        for (var face = 0; face < 6; face++) {
            for (var tileIndexY = 0; tileIndexY < GOOGLE.Panorama.IMAGES_PER_DIMENSION[resolution]; tileIndexY++) {
                for (var tileIndexX = 0; tileIndexX < GOOGLE.Panorama.IMAGES_PER_DIMENSION[resolution]; tileIndexX++) {
                    urls.push("{0}?panoid={1}&output=tile&x={2}&y={3}&zoom={4}".format(
                        GOOGLE.Panorama.SERVER_URL,
                        imageId,
                        tileIndexX + face,
                        tileIndexY + face,
                        resolution + 2
                    ));
                }
            }
        }

        console.log(urls);

        return urls;
    }
});
