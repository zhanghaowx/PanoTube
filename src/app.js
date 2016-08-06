/**
 * This library helps to draw a panorama image in web browser.
 * It builds on three.js r67. There is no guarantee that it will work with
 * other version of three.js.
 */

define([
    "scene/Cube3D",
    "scene/Sphere3D",
    "scene/Selection3D",
    "controls/OrbitControls",
    "dat_gui",
], function (Cube3D, Sphere3D) {
    var App = function (mapContainer) {
        // create a perspective camera
        this.camera = new THREE.PerspectiveCamera(75, mapContainer.width() / mapContainer.height(), 0.1, 1000);

        // create a proper renderer
        this.renderer = this.supportsWebGL() ? new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true // for taking screenshots, it can cause significant performance loss on some platforms
        }) : new THREE.CanvasRenderer();
        this.renderer.setSize(mapContainer.width(), mapContainer.height());

        // create a camera controller
        this.controller = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        // link renderer to a DOM element
        this.mapContainer = mapContainer[0];
        this.mapContainer.appendChild(this.renderer.domElement);

        // create a scene and add needed meshes for displaying panoramas
        this.scene = new THREE.Scene();

        // bind resize event
        mapContainer.resize(this.onWindowResize.bind(this));

        this.draw();
    };

    /**
     * Load panorama image to renderer
     */
    App.prototype.loadScene = function (options) {
        this.createPanorama(options);
        this.createSelection3D();
    }

    App.prototype.clearPanorama = function () {
        this.scene.remove(this.panorama);
        this.panorama = null;
    };

    App.prototype.createPanorama = function (options) {
        if (!options.type) {
            console.error("Please choose a Panorma type!");
        }
        if (options.type === Cube3D.TYPE && Cube3D.validate(options)) {
            this.panorama = (new Cube3D(options)).createCube();
        } else if (options.type === Sphere3D.TYPE && Sphere3D.validate(options)) {
            this.panorama = (new Sphere3D(options)).createSphere();
        }

        if (this.panorama) {
            this.scene.add(this.panorama);
        }
    }

    App.prototype.clearSelection3D = function () {
        var index = this.controller.selectable.indexOf(this.selection3D);
        if (index > -1)
            this.controller.selectable.splice(index, 1)

        if (this.selection3D != null) {
            this.scene.remove(this.selection3D);
            this.selection3D = null;
        }
    }

    App.prototype.createSelection3D = function (options) {
        var defaults = {
            azimuth: 20, // horizontal angle measured anti-clockwise from a north base line
            polar: 90, // vertical angle measure from top to bottom
            width: 10, // width of the seleciton area in degrees
            height: 10, // height of the selection area in degrees
            focus: true, // whether or not to set camera to selection area
            static: false, // whether or not user can drag and resize the area
            enable: false,
        };
        var settings = $.extend(defaults, options);
        if (!settings.enable)
            return;

        this.selection3D = new THREE.Selection3D();
        if (settings.static) {
            this.selection3D.addStaticMesh(settings.azimuth, settings.polar,
                settings.width, settings.height);
        } else {
            this.selection3D.addDynamicMesh(settings.azimuth, settings.polar,
                settings.width, settings.height);
        }

        this.scene.add(this.selection3D);

        // move camera to blur area
        if (settings.focus) {
            this.controller.yaw = this.selection3D.getParameters().yaw;
            this.controller.pitch = this.selection3D.getParameters().pitch;
        }

        // add blur area to selectable
        if (!settings.static) {
            this.controller.selectable.push(this.selection3D);
        }
    }

    /**
     * Create a dashboard to monitor statistics
     * Requires: dat.gui (https://github.com/dataarts/dat.gui)
     */
    App.prototype.createDebugGUI = function () {
        var gui = new dat.GUI();
        var that = this;

        var autoRotateGUI = gui.addFolder('AutoRotate');
        autoRotateGUI.add(this.controller.autoRotate, 'enable');
        autoRotateGUI.add(this.controller.autoRotate, 'speed').min(0.1).max(1);
        autoRotateGUI.open();

        var cameraGUI = gui.addFolder('Camera');
        cameraGUI.add(this.controller, 'yaw').min(-180).max(180).listen();
        cameraGUI.add(this.controller, 'pitch').min(-85).max(85).listen();
        cameraGUI.add(this.camera, 'fov')
            .min(this.controller.minFov)
            .max(this.controller.maxFov).listen().onChange(function () {
                that.camera.updateProjectionMatrix();
            });
        cameraGUI.open();

        if (this.selection3D) {
            var blurGUI = gui.addFolder('Blur');
            blurGUI.add(this.selection3D.mesh.parameters, 'yaw').listen();
            blurGUI.add(this.selection3D.mesh.parameters, 'pitch').listen();
            blurGUI.add(this.selection3D.mesh.parameters, 'widthInDeg').listen();
            blurGUI.add(this.selection3D.mesh.parameters, 'heightInDeg').listen();

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
