define(["core/String"], function () {
    HERE = {};
    HERE.Panorama = {};
    HERE.Panorama.SERVER_URL = "http://sli.data.here.com";
    HERE.Panorama.IMAGES_PER_DIMENSION = [1, 2, 4, 8];
    HERE.Panorama.RESOLUTION = {
        LOW: 0,
        MEDIUM: 1,
        HIGH: 2,
        ULTRA: 3
    }

    /**
     * This function generates a list of HERE street level image URLs based on passed in resolution level.
     * It returns an order of tile paths as following:
     * 1000017402_r9_f0_x0_y0.jpg
     * 1000017402_r9_f0_x1_y0.jpg
     * 1000017402_r9_f0_x0_y1.jpg
     * 1000017402_r9_f0_x1_y1.jpg ...
     * The definitions of face number(f), tile number(x,y) and resolution(r) are the same as in journey view API documentation.
     * For resolution (8 ~ 11):
     * <li>r8: each face has 1 x 1 = 1 tile</li>
     * <li>r9: each face has 2 x 2 = 4 tiles</li>
     * <li>r10: each face has 4 x 4 = 16 tiles</li>
     * <li>r11: each face has 8 x 8 = 64 tiles</li>
     * @param {string} imageId ID of the Panorama
     * @param {int} resolution a value between [0,3], when 0 means lowest and 3 means highest resolution.
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
            for (var tileIndexY = 0; tileIndexY < HERE.Panorama.IMAGES_PER_DIMENSION[resolution]; tileIndexY++) {
                for (var tileIndexX = 0; tileIndexX < HERE.Panorama.IMAGES_PER_DIMENSION[resolution]; tileIndexX++) {
                    filenames.push("{0}_r{1}_f{2}_x{3}_y{4}.jpg".format(
                        imageId, resolution + 8, face, tileIndexX, tileIndexY)); // HERE's resolution start from 8
                }
            }
        }

        return filenames;

    }

});
