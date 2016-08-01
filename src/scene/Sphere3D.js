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
            texture: "",
        }, options);
    };

    /**
     * Check if the configuration is valid and fill some optional (unset) configuration values
     */
    Sphere3D.validate = function (options) {
        if (!options.texture) {
            console.debug("Skip creating sphere: no texture provided!");
            return false;
        }

        return true;
    }

    /**
     * Create material for cube mesh
     */
    Sphere3D.prototype.createMaterials = function () {
        THREE.ImageUtils.crossOrigin = ''; // allow images from cross-origin servers
        var texture = this.settings.texture;
        return new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(texture, undefined, function () {
                console.debug("Texture " + texture + " loaded.")
            }, function () {
                console.error("Fail to load " + texture);
            })
        });
    }

    /**
     * Create a cube mesh with materials
     */
    Sphere3D.prototype.createSphere = function () {
        var geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);

        return new THREE.Mesh(geometry, this.createMaterials());
    };

    return Sphere3D;
});
