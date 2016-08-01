/**
 * This library helps to draw a panorama image in web browser, the same
 * functionality you see at here.com street level view.
 * It builds on three.js r67. There is no guarantee that it will work with
 * other version of three.js.
 */

define([
    "geometries/PanoramaCubeGeometry",
    "controls/OrbitControls",
    "scene/BlurArea",
    "core/Object3D",
    "core/String",
    "three"
], function () {
    /**
     * Cube3D represents a cube in a 3D world, and the camera is put in the
     * middle of this cube. Panoramic images are loaded for all the 6 faces of
     * the cube.
     */
    var Cube3D = function (mapContainer, options) {
        // create a perspective camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // create a proper renderer
        this.renderer = this.supportsWebGL() ? new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true // for taking screenshots, it can cause significant performance loss on some platforms
        }) : new THREE.CanvasRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // create a camera controller
        this.controller = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        // link renderer to a DOM element
        this.mapContainer = mapContainer[0];
        this.mapContainer.appendChild(this.renderer.domElement);

        // create a scene and add needed meshes for displaying panoramas
        this.scene = new THREE.Scene();

        // bind resize event
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.draw();
    };

    /**
     * Load panorama image to renderer
     */
    Cube3D.prototype.loadPanorama = function (options) {
        THREE.ImageUtils.crossOrigin = ''; // allow images from cross-origin servers

        var that = this;

        // create user settings
        this.defaults = {
            cubeSize: 1000, // used internally for dynamic resolutioni, controls size of the panorama cube
            resolution: 0, // used internally for dynamic resolution (start from lowest resolution, and increase until resolution is high)
            imageId: "", // either imageId or tiles must be set
            tiles: [], // in order of front,right,back,left,bottom,top
            onCubeReady: function () {
                that.upgrade();
                console.log("Cube (#{0}) of resolution {1} is loaded.".f(that.settings.imageId, that.settings.resolution));
            },
            showPanorama: true,
            // example of blurArea settings
            //            blurArea: {
            //                width: 5,
            //                height: 5,
            //                azimuth: 90,
            //                polar: 90,
            //                focus: true,
            //                offset: 10, // blur area needs be 10 degrees away from north/south pole,
            //                static: false // whether or not allow rezie/move blur area
            //            }
        };
        this.settings = $.extend({}, this.defaults, options);

        this.createPanorama();
        this.createBlurArea();
    }

    /**
     * Check if the configuration is valid and fill some optional (unset) configuration values
     */
    Cube3D.prototype.validate = function () {
        if (this.settings.tiles.length == 0 && this.settings.imageId.length == 0) {
            console.error("Fail to create cube: either tiles or imageId must be set!");
            return false;
        }

        // if tiles not set, fill it with URLs created from imageId and resolution
        if (this.settings.tiles.length == 0)
            return false; // TODO: check size of tiles against resolution

        if (this.settings.imageId.length == 0) {
            // TODO: remove imageId from settings
        }

        // Don't allow resolution 11 because it is more than necessary
        if (this.settings.resolution < 0 || this.settings.resolution > 3) {
            console.error("Fail to create cube: resolution value should be in [0, 3].");
            return false;
        }

        return true;
    }

    /**
     * Upgrade resolution to next level
     */
    Cube3D.prototype.upgrade = function () {
        this.settings.cubeSize++;
        this.settings.resolution++;
        this.settings.tiles = [];

        // save before being changed
        var oldCube = this.cube;
        var oldOnCubeReady = this.settings.onCubeReady;

        if (this.validate()) {
            // remove old cube when new cube is ready
            var that = this;
            this.settings.onCubeReady = function () {
                that.scene.remove(oldCube);
                oldOnCubeReady();
            }
            this.createPanorama();
        } else {
            this.settings.cubeSize--;
            this.settings.resolution--;
        }
    }

    /**
     * Clear current panorama
     */
    Cube3D.prototype.clearPanorama = function () {
        this.scene.remove(this.cube);
        this.cube = null;
    };

    Cube3D.prototype.createPanorama = function () {
        if (!this.validate())
            return;

        this.cube = this.createCube();
        this.scene.add(this.cube);
    }

    Cube3D.prototype.clearBlurArea = function () {
        if (this.blurArea != null) {
            this.scene.remove(this.blurArea);
            this.blurArea = null;
        }

        this.controller.selectable = [];
    }

    Cube3D.prototype.createBlurArea = function () {
        if (!this.validate())
            return;

        if (this.settings.blurArea) {
            this.blurArea = new THREE.BlurArea();
            if (this.settings.blurArea.static) {
                this.blurArea.addStaticMesh(this.settings.blurArea.azimuth, this.settings.blurArea.polar,
                    this.settings.blurArea.width, this.settings.blurArea.height);
            } else {
                this.blurArea.addDynamicMesh(this.settings.blurArea.azimuth, this.settings.blurArea.polar,
                    this.settings.blurArea.width, this.settings.blurArea.height, this.settings.blurArea.offset);
            }

            this.scene.add(this.blurArea);

            // move camera to blur area
            if (this.settings.blurArea.focus) {
                this.controller.yaw = this.blurArea.getParameters().yaw;
                this.controller.pitch = this.blurArea.getParameters().pitch;
            }

            // add blur area to selectable
            if (!this.settings.blurArea.static) {
                this.controller.selectable.push(this.blurArea);
            }
        }
    }

    /**
     * Detects whether the web browser supports WebGL or not
     */
    Cube3D.prototype.supportsWebGL = function () {
        try {
            return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
        } catch (e) {
            return false;
        }
    };

    /**
     * Load texture for a image tile
     */
    var tilesReadyCount = 0;
    Cube3D.prototype.getTexture = function (path) {
        var that = this;
        return new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(path, undefined, function () {
                tilesReadyCount++;
                if (tilesReadyCount == that.settings.tiles.length) {
                    that.settings.onCubeReady();
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

        var textureSegments = Math.pow(2, this.settings.resolution);
        var segments = Math.max(textureSegments, 16); // use 16 as minimum value to get rid of distortion
        var geometry = new THREE.PanoramaCubeGeometry(this.settings.cubeSize, this.settings.cubeSize, this.settings.cubeSize, segments, segments, segments);

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

    Cube3D.prototype.update = function () {
        this.controller.update();
        this.renderer.render(this.scene, this.camera);
    };

    Cube3D.prototype.draw = function () {
        requestAnimationFrame(this.draw.bind(this));
        this.update();
    };

    Cube3D.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    return Cube3D;
});
