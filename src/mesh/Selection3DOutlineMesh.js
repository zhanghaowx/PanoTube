define(["three", "geometries/RectangleOutlineGeometry"], function () {
    /**
     * Create a mesh for the blur area
     */
    THREE.Selection3DOutlineMesh = function (yaw, pitch, widthInDeg, heightInDeg) {

        this.parameters = {};

        /**
         * Rebuild the mesh with a new set of parameters
         */
        this.rebuild = function(parameters) {
            console.error("Rebuild blur area outline mesh is not supported yet!");
        };

        // Internals
        var that = this;

        var setupParameters = function (yaw, pitch, widthInDeg, heightInDeg) {
            if (yaw != null) {
                that.parameters.yaw = yaw;
            }

            if (pitch != null) {
                that.parameters.pitch = pitch;
            }

            if (widthInDeg != null) {
                that.parameters.heightInDeg = heightInDeg;
            }

            if (heightInDeg != null) {
                that.parameters.widthInDeg = widthInDeg;
            }

        };
        setupParameters(yaw, pitch, widthInDeg, heightInDeg);

        // construct
        var meshMaterial = new THREE.MeshBasicMaterial({
            color: "#1155C9",
            transparent: true,
            opacity: 0.75,
            overdraw: 0.1,
            side: THREE.DoubleSide
        });

        this.outlineGeometry = new THREE.RectangleOutlineGeometry(this.parameters);
        THREE.Mesh.call(this, this.outlineGeometry, meshMaterial);
    };

    THREE.Selection3DOutlineMesh.prototype = Object.create(THREE.Mesh.prototype);

});
