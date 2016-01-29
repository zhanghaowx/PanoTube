/**
 * This file provides util functions for HERE Street Level API
 */
define([
    "here/api",
    "core/String"
], function () {

    HERE.Panorama.SERVER_URL = "http://sli.data.here.com";

    HERE.Panorama.IMAGES_PER_DIMENSION = [1, 2, 4, 8];

    /**
     * This function generates a list of HERE street level image URLs based on passed in resolution level.
     */
    HERE.Panorama.getImageUrls = function (imageId, resolution) {
        var urls = [];
        HERE.Panorama.getImageFilenames(imageId, resolution).forEach(function (filename) {
            urls.push(HERE.Panorama.getImageUrl(filename));
        });
        return urls;
    }

    /**
     * returns a URL for given image file name
     */
    HERE.Panorama.getImageUrl = function (filename) {
        var imageId = filename.substring(0, filename.indexOf('_'));
        var formatted = imageId.leftPad('0', 10);

        var url = "{0}/{1}/{2}/{3}/{4}/{5}/{6}".format(
            HERE.Panorama.SERVER_URL,
            "0", // fake coverage id
            formatted.substring(0, 4),
            formatted.substring(4, 6),
            formatted.substring(6, 8),
            formatted.substring(8, 10),
            filename);

        return url;
    }

    /**
     * Returns all image filenames for given resolution
     */
    HERE.Panorama.getImageFilenames = function (imageId, resolution) {
        var filenames = [];

        // JPEG
        for (var face = 0; face < 6; face++) {
            for (var tileIndexY = 0; tileIndexY < HERE.Panorama.IMAGES_PER_DIMENSION[resolution - 8]; tileIndexY++) {
                for (var tileIndexX = 0; tileIndexX < HERE.Panorama.IMAGES_PER_DIMENSION[resolution - 8]; tileIndexX++) {
                    filenames.push("{0}_r{1}_f{2}_x{3}_y{4}.jpg".format(
                        imageId, resolution, face, tileIndexX, tileIndexY));
                }
            }
        }

        return filenames;

    }
});
