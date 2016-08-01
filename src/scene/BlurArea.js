define([
    "three",
    "geometries/RectangleGeometry",
    "mesh/BlurAreaMesh",
    "mesh/BlurAreaOutlineMesh"
], function () {

    THREE.BlurArea = function () {

        THREE.Object3D.call(this);

        /**
         * Get blur area azimuth, polar, widthInDeg, and heightInDeg values
         */
        this.getParameters = function () {
            return {
                yaw: this.mesh.parameters.yaw,
                pitch: this.mesh.parameters.pitch,
                azimuth: yawToAzimuth(this.mesh.parameters.yaw),
                polar: pitchToPolar(this.mesh.parameters.pitch),
                heightInDeg: this.mesh.parameters.heightInDeg,
                widthInDeg: this.mesh.parameters.widthInDeg
            };
        }

        /**
         * Update blur area with new set of azimuth, polar, widthInDeg, and heightInDeg
         */
        this.updateParameters = function (args) {
            var newParameters = $.extend({}, this.getParameters(), args);
            this.mesh.rebuild({
                yaw: azimuthToYaw(newParameters.azimuth),
                pitch: polarToPitch(newParameters.polar),
                heightInDeg: newParameters.heightInDeg,
                widthInDeg: newParameters.widthInDeg
            });
        }

        this.printParameters = function () {
            console.log(this.getParameters());
        }

        /// Either addDynamicMesh or addStaticMesh should be called after constructor

        this.addDynamicMesh = function (azimuth, polar, widthInDeg, heightInDeg, offset) {
            this.mesh = new THREE.BlurAreaMesh(azimuthToYaw(azimuth), polarToPitch(polar), widthInDeg, heightInDeg, offset);
            this.mesh.addControllers();
            this.children.push(this.mesh);
        };

        this.addStaticMesh = function (azimuth, polar, widthInDeg, heightInDeg) {
            this.mesh = new THREE.BlurAreaOutlineMesh(azimuthToYaw(azimuth), polarToPitch(polar), widthInDeg, heightInDeg);
            this.children.push(this.mesh);
        };

        // Internals
        var that = this;

        var azimuthToYaw = function (azimuth) {
            return (-azimuth) % 360;
        };

        var polarToPitch = function (polar) {
            return (90 - polar);
        };

        var yawToAzimuth = function (yaw) {
            var azimuth = (-yaw) % 360;
            return (azimuth + 360) % 360; // limit azimuth range to [0, 360)
        };

        var pitchToPolar = function (pitch) {
            var polar = 90 - pitch;
            return (polar + 360) % 360; // limit polar range to [0, 360)
        };
    };

    THREE.BlurArea.prototype = Object.create(THREE.Object3D.prototype);
});
