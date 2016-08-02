/**
 * This library helps to draw a panorama image in web browser.
 * It builds on three.js r67. There is no guarantee that it will work with
 * other version of three.js.
 */

define([
    "scene/Cube3D",
    "scene/Sphere3D",
    "scene/BlurArea",
    "controls/OrbitControls",
    "dat_gui",
], function (Cube3D, Sphere3D) {
    var App = function (mapContainer) {
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
    App.prototype.loadScene = function (options) {
        this.createPanorama(options);
        this.createBlurArea();
    }

    App.prototype.clearPanorama = function () {
        this.scene.remove(this.panorama);
        this.panorama = null;
    };

    App.prototype.createPanorama = function (options) {
        if (Cube3D.validate(options)) {
            this.panorama = (new Cube3D(options)).createCube();
        } else if (Sphere3D.validate(options)) {
            this.panorama = (new Sphere3D(options)).createSphere();
        }

        if (this.panorama) {
            this.scene.add(this.panorama);
        }
    }

    App.prototype.clearBlurArea = function () {
        if (this.blurArea != null) {
            this.scene.remove(this.blurArea);
            this.blurArea = null;
        }

        this.controller.selectable = [];
    }

    App.prototype.createBlurArea = function () {
        if (this.settings && this.settings.blurArea) {
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
     * Create a dashboard to monitor statistics
     * Requires: dat.gui (https://github.com/dataarts/dat.gui)
     */
    App.prototype.createDebugGUI = function() {
        var gui = new dat.GUI();
        var cameraGUI = gui.addFolder('Camera');
        cameraGUI.add(this.controller, 'autoRotate');
        cameraGUI.add(this.controller, 'autoRotateSpeed').min(0.1).max(1);
        cameraGUI.add(this.controller, 'yaw').min(-180).max(180).listen();
        cameraGUI.add(this.controller, 'pitch').min(-85).max(85).listen();
        cameraGUI.add(this.camera, 'fov')
            .min(this.controller.minFov)
            .max(this.controller.maxFov).listen().onChange(function() {
                this.camera.updateProjectionMatrix();
            });
        cameraGUI.open();

        if (this.settings.blurArea) {
            var blurGUI = gui.addFolder('Blur');
            blurGUI.add(this.blurArea.mesh.parameters, 'yaw').listen();
            blurGUI.add(this.blurArea.mesh.parameters, 'pitch').listen();
            blurGUI.add(this.blurArea.mesh.parameters, 'widthInDeg').listen();
            blurGUI.add(this.blurArea.mesh.parameters, 'heightInDeg').listen();

            blurGUI.open();
        }
    };

    /**
     * Detects whether the web browser supports WebGL or not
     */
    App.prototype.supportsWebGL = function () {
        try {
            return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
        } catch (e) {
            return false;
        }
    };

    App.prototype.update = function () {
        this.controller.update();
        this.renderer.render(this.scene, this.camera);
    };

    App.prototype.draw = function () {
        requestAnimationFrame(this.draw.bind(this));
        this.update();
    };

    App.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    $.fn.panorama = function (options) {
        var name = "zhanghaowx-panorama";
        var panorama = $(this).data(name);
        if (panorama) {
            panorama.clearPanorama();
            panorama.loadScene(options);
        } else {
            var panorama = new App(this);
            panorama.loadScene(options);
            $(this).data(name, panorama);
        }
        return panorama;
    };

    return Cube3D;
});
