/**
 * This library helps to draw a panorama image in web browser.
 * It builds on three.js r67. There is no guarantee that it will work with
 * other version of three.js.
 */

define([
    "controls/OrbitControls",
    "scene/BlurArea",
    "core/Object3D",
    "core/String",
    "three"
], function () {
    /**
     * Sphere3D represents a sphere in a 3D world, and the camera is put in the
     * middle of this cube. Panoramic images are mapped to the surface of sphere.
     */
    var Sphere3D = function (mapContainer, options) {
        // create user settings
        this.settings = $.extend({
            texture: "",
            showPanorama: true, // visibility of panorama, used for debugging
        }, options);

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
    Sphere3D.prototype.loadScene = function (options) {
        $.extend(this.settings, options);
        this.createPanorama();
        this.createBlurArea();
    }

    /**
     * Check if the configuration is valid and fill some optional (unset) configuration values
     */
    Sphere3D.prototype.validate = function () {
        if (!this.settings.texture) {
            console.error("Fail to create sphere: no texture provided!");
            return false;
        }

        return true;
    }

    /**
     * Clear current panorama
     */
    Sphere3D.prototype.clearPanorama = function () {
        this.scene.remove(this.sphere);
        this.sphere = null;
    };

    Sphere3D.prototype.createPanorama = function () {
        if (!this.validate())
            return;

        this.sphere = this.createSphere();
        this.scene.add(this.sphere);
    }

    Sphere3D.prototype.clearBlurArea = function () {
        if (this.blurArea != null) {
            this.scene.remove(this.blurArea);
            this.blurArea = null;
        }

        this.controller.selectable = [];
    }

    Sphere3D.prototype.createBlurArea = function () {
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
    Sphere3D.prototype.supportsWebGL = function () {
        try {
            return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
        } catch (e) {
            return false;
        }
    };

    /**
     * Create material for cube mesh
     */
    Sphere3D.prototype.createMaterials = function () {
        THREE.ImageUtils.crossOrigin = ''; // allow images from cross-origin servers
        return new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(this.settings.texture)
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

    Sphere3D.prototype.update = function () {
        this.controller.update();
        this.renderer.render(this.scene, this.camera);
    };

    Sphere3D.prototype.draw = function () {
        requestAnimationFrame(this.draw.bind(this));
        this.update();
    };

    Sphere3D.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    return Sphere3D;
});
