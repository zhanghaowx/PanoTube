define([
    "core/Object3D",
    "core/String",
    "three"
], function () {
    /**
     * Sphere3D represents a sphere in a 3D world, and the camera is put in the
     * middle of this cube. Panoramic images are mapped to the surface of sphere.
     */
    var Sphere3D = function (options) {
        // create user settings
        this.settings = $.extend({
            tiles: [],
            rows: 1, // number of tiles horizontally
            columns: 1, // number of tiles vertically
            dimensionOffset: 0
        }, options);
        // canvas for creating texture by merging tiles
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.isInitialized = false;
    };

    Sphere3D.TYPE = "sphere";

    /**
     * Check if the configuration is valid and fill some optional (unset) configuration values
     */
    Sphere3D.validate = function (options) {
        if (!options.tiles) {
            console.debug("Skip creating sphere: no tiles provided!");
            return false;
        }

        return true;
    };

    /**
     * Initialize the size of canvas and context
     */
    Sphere3D.prototype.initializeContext = function (width, height) {
        if (this.isInitialized)
            return;
        this.isInitialized = true;

        this.canvas.width = width;
        this.canvas.height = height;
        this.context.translate(this.canvas.width, 0);
        this.context.scale(-1, 1);
        console.debug("Context initialized with dimensions {0}x{1}".format(width, height));
    };

    /**
     * Create a cube mesh with materials
     */
    Sphere3D.prototype.createSphere = function () {
        var geometry = new THREE.SphereGeometry(1000, 60, 40);
        geometry.scale(-1, 1, 1);

        var self = this;
        var texture = new THREE.Texture(this.canvas);

        for (var y = 0; y < this.settings.rows; y++) {
            for (var x = 0; x < this.settings.columns; x++) {
                (function (x, y) {
                    var img = new Image();
                    img.addEventListener('load', function () {
                        self.initializeContext(self.settings.columns * (img.width + self.settings.dimensionOffset), self.settings.rows * ((img.height + self.settings.dimensionOffset)))
                        self.context.drawImage(this, x * img.width, y * img.height);
                        texture.needsUpdate = true;
                    });
                    img.crossOrigin = '';
                    img.src = self.settings.tiles[y * self.settings.columns + x];
                })(x, y);
            }
        }

        // tiles merged into a single image attached to texture
        var texture = new THREE.Texture(this.canvas);
        var material = new THREE.MeshBasicMaterial({
            map: texture
        });

        return new THREE.Mesh(geometry, material);
    };

    return Sphere3D;
});
