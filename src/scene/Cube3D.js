define([
    "geometries/PanoramaCubeGeometry",
    "core/String",
    "three"
], function () {
    // used internally for controlling size of the panorama cube
    var cubeSize = 1000;
    // used internally for texture mapping
    var cubeResolution = 0;
    // used internally for couting downloaded tiles
    var tilesReadyCount = 0;
    /**
     * Cube3D represents a cube in a 3D world, and the camera is put in the
     * middle of this cube. Panoramic images are loaded for all the 6 faces of
     * the cube.
     */
    var Cube3D = function (options) {
        // create user settings
        this.settings = $.extend({
            tiles: [], // in order of front,right,back,left,bottom,top
            onTilesReady: function () {}, // get notification when all tiles are loaded
        }, options);
    };

    /**
     * Check if the configuration is valid and fill some optional (unset) configuration values
     */
    Cube3D.validate = function (options) {
        if (!options.tiles) {
            console.debug("Skip creating cube: no tiles defined!");
            return false;
        }

        var tilesPerFace = Math.round(options.tiles.length / 6);
        switch (tilesPerFace) {
        case 0:
            break;
        case 1: // each face has 1 tile
            cubeResolution = 0;
            break;
        case 4: // each face has 2x2 tiles
            cubeResolution = 1;
            break;
        case 16: // each face has 4x4 tiles
            cubeResolution = 2;
            break;
        case 64: // each face has 16x16 tiles
            cubeResolution = 3;
            break;
        default:
            console.debug("Skip creating cube: invlaid number of tiles {0}!".format(options.tiles.length));
            return false;
        }

        return true;
    }

    /**
     * Load texture for a image tile
     */
    Cube3D.prototype.getTexture = function (path) {
        THREE.ImageUtils.crossOrigin = ''; // allow images from cross-origin servers

        var that = this;
        return new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(path, undefined, function () {
                tilesReadyCount++;
                if (tilesReadyCount == that.settings.tiles.length) {
                    that.settings.onTilesReady();
                }
            }, function () {
                console.error("Fail to load " + path);
            }),
            overdraw: true
        });
    }

    /**
     * Create material for cube mesh
     */
    Cube3D.prototype.createMaterials = function () {
        var materials = [];
        var tiles = this.settings.tiles;
        for (var i = 0; i < tiles.length; i++) {
            materials.push(this.getTexture(tiles[i]));
        }

        return new THREE.MeshFaceMaterial(materials);
    }


    /**
     * Create a cube mesh with materials
     */
    Cube3D.prototype.createCube = function () {

        var textureSegments = Math.pow(2, cubeResolution);
        var segments = Math.max(textureSegments, 16); // use 16 as minimum value to get rid of distortion
        var geometry = new THREE.PanoramaCubeGeometry(cubeSize, cubeSize, cubeSize, segments, segments, segments);

        var facesCount = geometry.faces.length / 2; // each face has two triangles

        for (var i = 0; i < facesCount; i++) {
            // use (x, y) to represent each face
            var x = Math.floor(i / segments);
            var y = i % segments;
            // use (mX, mY) to represent each texture tile
            var mXRange = Math.floor(x / (segments / textureSegments)); // mX in the range of [mXRange * segments, (mXRange + 1) * segments)
            var mYRange = Math.floor(y / (segments / textureSegments)); // mY in the range of [mYRange * segments, (mYRange + 1) * segments)

            // compute material index
            var mIndex = mXRange * textureSegments + mYRange;
            var fIndex = i * 2;
            geometry.faces[fIndex].materialIndex = mIndex;
            geometry.faces[fIndex + 1].materialIndex = mIndex;
            /*console.debug("i = " + i + ", x = " + x + ", y = " + y + ", mXRange = " + mXRange + ", mYRange = " + mYRange + ", materialIndex = " + mIndex);*/

            // compute UVs
            var delta = 1 / segments * textureSegments;
            var x0 = (i * delta) % 1;
            var y0 = 1 - delta - (Math.floor(i / segments) * delta) % 1;
            // console.debug("x0 = " + x0 + ", y0 = " + y0);

            var v00 = new THREE.Vector2(x0, y0);
            var v01 = new THREE.Vector2(x0, y0 + delta);
            var v10 = new THREE.Vector2(x0 + delta, y0);
            var v11 = new THREE.Vector2(x0 + delta, y0 + delta);
            geometry.faceVertexUvs[0][fIndex] = [v01, v00, v11];
            geometry.faceVertexUvs[0][fIndex + 1] = [v00, v10, v11];
        }

        return new THREE.Mesh(geometry, this.createMaterials());
    };

    return Cube3D;
});
