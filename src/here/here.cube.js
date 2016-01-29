/**
 * This library helps to draw a panorama image in web browser, the same
 * functionality you see at here.com street level view.
 * It builds on three.js r67. There is no guarantee that it will work with
 * other version of three.js.
 * It expects an order of tile paths as following:
 * 1000017402_r9_f0_x0_y0.jpg
 * 1000017402_r9_f0_x1_y0.jpg
 * 1000017402_r9_f0_x0_y1.jpg
 * 1000017402_r9_f0_x1_y1.jpg ...
 * The definitions of face number(f), tile number(x,y) and resolution(r) are the same as in journey view API documentation.
 */

define([
    "here/api",
    "core/String",
    "core/Object3D",
    "geometries/PanoramaCubeGeometry",
    "controls/OrbitControls",
    "world/BlurArea",
    "three"
], function () {
    /**
     * Cube3D represents a cube in a 3D world, and the camera is put in the
     * middle of this cube. Panoramic images are loaded for all the 6 faces of
     * the cube.
     */
    HERE.Cube3D = function (mapContainer, options) {
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
    HERE.Cube3D.prototype.loadPanorama = function (options) {
        // create user settings
        this.defaults = {
            cubeSize: 1000, // size of the panorama cube
            autoRotate: false,
            rotateSpeed: 0.1,
            resolution: 9,
            tiles: [],
            tilesReady: function () {},
            showPanorama: true,
            showBlurArea: true,
            blurArea: {
                width: 5,
                height: 5,
                azimuth: 90,
                polar: 90,
                focus: true,
                offset: 10, // blur area needs be 10 degrees away from north/south pole,
                static: false // whether or not allow rezie/move blur area
            }
        };

        this.settings = $.extend({}, this.defaults, options);

        // create cube
        this.cube = this.createCube();
        this.scene.add(this.cube);

        // create blur area
        if (this.settings.showBlurArea) {
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
     * Clear current panorama
     */
    HERE.Cube3D.prototype.clearPanorama = function () {
        this.scene.remove(this.cube);
        this.cube = null;

        if (this.blurArea != null) {
            this.scene.remove(this.blurArea);
            this.blurArea = null;
        }

        this.controller.selectable = [];
    };

    /**
     * Create a dashboard to monitor statistics
     * Requires: dat.gui (https://github.com/dataarts/dat.gui)
     */
    HERE.Cube3D.prototype.createDebugGUI = function () {
        var gui = new dat.GUI();
        var cube3D = this;

        var cameraGUI = gui.addFolder('Camera');
        cameraGUI.add(this.controller, 'autoRotate');
        cameraGUI.add(this.controller, 'autoRotateSpeed').min(0.1).max(1);
        cameraGUI.add(this.controller, 'yaw').min(-180).max(180).listen();
        cameraGUI.add(this.controller, 'pitch').min(-85).max(85).listen();
        cameraGUI.add(this.camera, 'fov').min(this.controller.minFov).max(this.controller.maxFov).listen().onChange(function () {
            cube3D.camera.updateProjectionMatrix();
        });
        cameraGUI.open();

        if (this.settings.showBlurArea) {
            var blurGUI = gui.addFolder('Blur');
            blurGUI.add(this.blurArea.mesh.parameters, 'yaw').listen();
            blurGUI.add(this.blurArea.mesh.parameters, 'pitch').listen();
            blurGUI.add(this.blurArea.mesh.parameters, 'widthInDeg').listen();
            blurGUI.add(this.blurArea.mesh.parameters, 'heightInDeg').listen();

            blurGUI.open();
        }

        var debugGUI = gui.addFolder('Debug');
        debugGUI.add(this.settings, 'showPanorama').onChange(function (value) {
            cube3D.cube.visible = value;
        });
        debugGUI.open();
    };

    /**
     * Detects whether the web browser supports WebGL or not
     */
    HERE.Cube3D.prototype.supportsWebGL = function () {
        try {
            return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
        } catch (e) {
            return false;
        }
    };


    /**
     * Create a cube mesh with materials
     */
    HERE.Cube3D.prototype.createCube = function () {

        // load texture for a image tile
        var that = this;
        var tilesReadyCount = 0;
        var getTexture = function (path) {
            THREE.ImageUtils.crossOrigin = ''; // allow images from cross-origin servers
            return new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture(path, undefined, function () {
                    tilesReadyCount = tilesReadyCount + 1;
                    if (tilesReadyCount == that.settings.tiles.length) {
                        that.settings.tilesReady();
                    }
                }, function () {
                    console.error("Fail to load " + path);
                }),
                overdraw: true
            });
        };

        /**
         * <li>r8: each face has 1 x 1 = 1 tile</li>
         * <li>r9: each face has 2 x 2 = 4 tiles</li>
         * <li>r10: each face has 4 x 4 = 16 tiles</li>
         * <li>r11: each face has 8 x 8 = 64 tiles</li>
         */
        var materials = [];
        var tiles = this.settings.tiles;
        for (var i = 0; i < tiles.length; i++) {
            materials.push(getTexture(tiles[i]));
        }

        var textureSegments = Math.pow(2, this.settings.resolution - 8);
        var segments = Math.max(textureSegments, 16); // use 16 as minimum value to get rid of distortion
        var geometry = new THREE.PanoramaCubeGeometry(this.settings.cubeSize, this.settings.cubeSize, this.settings.cubeSize, segments, segments, segments);

        var materialsCount = materials.length;
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

        return new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
    };

    HERE.Cube3D.prototype.update = function () {
        this.controller.update();
        this.renderer.render(this.scene, this.camera);
    };

    HERE.Cube3D.prototype.draw = function () {
        requestAnimationFrame(this.draw.bind(this));
        this.update();
    };

    HERE.Cube3D.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
});
