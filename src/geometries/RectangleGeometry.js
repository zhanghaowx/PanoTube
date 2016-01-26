define(["core/Math", "three"], function () {

    /**
     * Create a rectangle and map it to the surface of a sphere located at (0, 0, 0)
     */
    THREE.RectangleGeometry = function (args) {

        THREE.Geometry.call(this);

        // Center of the sphere that the rectangle will be projected to
        this.center = new THREE.Vector3();
        this.corners = [];

        // Number of smaller rectangles on each border (for projection)
        this.divide = 10;

        this.params = {};

        /**
         * Destroy the rectangle geometry
         */
        this.destroy = function () {
            this.vertices = [];
            this.faces = [];
        }

        /**
         * Build the rectangle geometry
         */
        this.build = function () {

            var widthInDeg = this.params.widthInDeg;
            var heightInDeg = this.params.heightInDeg;

            var divide = this.divide;

            var rectWidth = widthInDeg / divide;
            var rectHeight = heightInDeg / divide;

            for (var i = 0; i < divide; i++) {
                var rectTopLeftYaw = -widthInDeg / 2.0 + rectWidth * i;
                for (var j = 0; j < divide; j++) {
                    var rectTopLeftPitch = -heightInDeg / 2.0 + rectHeight * j;
                    addRectangle(rectTopLeftYaw + rectWidth / 2.0, rectTopLeftPitch + rectHeight / 2.0, rectWidth, rectHeight);
                }
            }

            this.corners = getCorners();

            this.mergeVertices();

            this.verticesNeedUpdate = true;
            this.elementsNeedUpdate = true;
            this.normalsNeedUpdate = true;

            this.computeFaceNormals();
            this.computeVertexNormals();
            this.computeBoundingSphere();
        };

        this.rebuild = function (args) {
            this.params = {
                yaw: args.yaw,
                pitch: args.pitch,
                widthInDeg: args.widthInDeg,
                heightInDeg: args.heightInDeg
            };

            this.destroy();
            this.build();
        }

        // Internals
        var that = this;

        /**
         * Return the four corners of the rectangle
         */
        function getCorners() {
            var widthInDeg = that.params.widthInDeg;
            var heightInDeg = that.params.heightInDeg;

            return [rotate(THREE.Math.yawPitchToPoint(-widthInDeg / 2.0, heightInDeg / 2.0)),
                    rotate(THREE.Math.yawPitchToPoint(-widthInDeg / 2.0, -heightInDeg / 2.0)),
                    rotate(THREE.Math.yawPitchToPoint(widthInDeg / 2.0, heightInDeg / 2.0)),
                    rotate(THREE.Math.yawPitchToPoint(widthInDeg / 2.0, -heightInDeg / 2.0))];
        }

        /**
         * Rotate a vector by geometry center's yaw and pitch
         * @param {Type} v
         */
        function rotate(v) {
            var zAxis = new THREE.Vector3(0, 0, 1);
            var minusYAxis = new THREE.Vector3(0, -1, 0);

            v.applyAxisAngle(zAxis, THREE.Math.degToRad(that.params.pitch));
            v.applyAxisAngle(minusYAxis, THREE.Math.degToRad(that.params.yaw));

            return v;
        }

        /**
         * Add a sub rectangle to geometry. Each projected rectangle is merged by a list of
         * smaller rectangles. The idea is borrowed from the way we build a circle by merging
         * triangles.
         * @param {Type} yawInDeg
         * @param {Type} pitchInDeg
         * @param {Type} widthInDeg
         * @param {Type} heightInDeg
         */
        function addRectangle(yawInDeg, pitchInDeg, widthInDeg, heightInDeg) {
            var halfWidth = widthInDeg / 2.0;
            var halfHeight = heightInDeg / 2.0;

            var upperLeft = THREE.Math.yawPitchToPoint(yawInDeg + halfWidth, pitchInDeg + halfHeight).add(that.center);
            var upperRight = THREE.Math.yawPitchToPoint(yawInDeg - halfWidth, pitchInDeg + halfHeight).add(that.center);

            var lowerLeft = THREE.Math.yawPitchToPoint(yawInDeg + halfWidth, pitchInDeg - halfHeight).add(that.center);
            var lowerRight = THREE.Math.yawPitchToPoint(yawInDeg - halfWidth, pitchInDeg - halfHeight).add(that.center);

            var idxOffset = that.vertices.length;

            // add to geometry
            that.vertices.push(rotate(upperLeft));
            that.vertices.push(rotate(lowerLeft));
            that.vertices.push(rotate(upperRight));
            that.vertices.push(rotate(lowerRight));

            // fornt face
            that.faces.push(new THREE.Face3(0 + idxOffset, 2 + idxOffset, 1 + idxOffset));
            that.faces.push(new THREE.Face3(1 + idxOffset, 2 + idxOffset, 3 + idxOffset));

        }

        // construct
        this.rebuild(args);
    };

    THREE.RectangleGeometry.prototype = Object.create(THREE.Geometry.prototype);

});
