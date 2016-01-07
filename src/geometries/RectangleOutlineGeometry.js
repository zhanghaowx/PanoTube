define(["core/Math", "lib/three"], function () {

    /**
     * Create a rectangle outline and map it to the surface of a sphere located at (0, 0, 0)
     */
    THREE.RectangleOutlineGeometry = function (args) {

        THREE.Geometry.call(this);

        // Center of the sphere that the rectangle will be projected to
        this.center = new THREE.Vector3();
        this.corners = [];

        // Number of smaller rectangles on each border (for projection)
        this.divide = 10;

        this.dashLinePositionInPercent = 0.5

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

            var lineThicknessInDeg = Math.min(widthInDeg, heightInDeg) * 0.05;
            // 0.1 <= lineThicknessInDeg <= 0.5
            lineThicknessInDeg = Math.min(0.5, Math.max(0.1, lineThicknessInDeg));            

            var divide = this.divide;

            var rectWidth = widthInDeg / divide;
            var rectHeight = heightInDeg / divide;

            for (var i = 0; i < divide; i++) {
                var rectTopLeftYaw = -widthInDeg / 2.0 + rectWidth * i;
                for (var j = 0; j < divide; j++) {
                    var rectTopLeftPitch = -heightInDeg / 2.0 + rectHeight * j;

                    if (i == 0) { // draw vertical lines (left)
                        var from = {
                            yaw: rectTopLeftYaw,
                            pitch: rectTopLeftPitch
                        };
                        var to = {
                            yaw: rectTopLeftYaw,
                            pitch: rectTopLeftPitch - rectHeight
                        };
                        addLeftLine(from, to, lineThicknessInDeg);
                    }
                    if (i == divide - 1) { // draw vertical lines (right)
                        var from = {
                            yaw: rectTopLeftYaw + rectWidth,
                            pitch: rectTopLeftPitch
                        };
                        var to = {
                            yaw: rectTopLeftYaw + rectWidth,
                            pitch: rectTopLeftPitch - rectHeight
                        };
                        addRightLine(from, to, lineThicknessInDeg);
                    }
                    if (j == 0) { // draw horizontal lines (bottom)
                        var from = {
                            yaw: rectTopLeftYaw,
                            pitch: rectTopLeftPitch - rectHeight
                        };
                        var to = {
                            yaw: rectTopLeftYaw + rectWidth,
                            pitch: rectTopLeftPitch - rectHeight
                        };
                        addBottomLine(from, to, lineThicknessInDeg);
                    }
                    if (j == divide - 1) { // draw horizontal lines (top)
                        var from = {
                            yaw: rectTopLeftYaw,
                            pitch: rectTopLeftPitch
                        };
                        var to = {
                            yaw: rectTopLeftYaw + rectWidth,
                            pitch: rectTopLeftPitch
                        };
                        addTopLine(from, to, lineThicknessInDeg);
                    }
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

            return this;
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
         * Draw a line from one {yaw, pitch} to another {yaw, pitch}
         * @param {Type} fromYawPitch
         * @param {Type} toYawPitch
         * @param {Type} thickness
         */
        function addTopLine(fromYawPitch, toYawPitch, thickness) {
            var upperLeft = THREE.Math.yawPitchToPoint(fromYawPitch.yaw, fromYawPitch.pitch).add(that.center);
            var upperRight = THREE.Math.yawPitchToPoint(toYawPitch.yaw, toYawPitch.pitch).add(that.center);

            var lowerLeft = THREE.Math.yawPitchToPoint(fromYawPitch.yaw, fromYawPitch.pitch - thickness).add(that.center);
            var lowerRight = THREE.Math.yawPitchToPoint(toYawPitch.yaw, toYawPitch.pitch - thickness).add(that.center);
            
            createLine(upperLeft, upperRight, lowerLeft, lowerRight);
        };
        function addBottomLine(fromYawPitch, toYawPitch, thickness) {
            var upperLeft = THREE.Math.yawPitchToPoint(fromYawPitch.yaw, fromYawPitch.pitch + thickness).add(that.center);
            var upperRight = THREE.Math.yawPitchToPoint(toYawPitch.yaw, toYawPitch.pitch + thickness).add(that.center);

            var lowerLeft = THREE.Math.yawPitchToPoint(fromYawPitch.yaw, fromYawPitch.pitch).add(that.center);
            var lowerRight = THREE.Math.yawPitchToPoint(toYawPitch.yaw, toYawPitch.pitch).add(that.center);
            
            createLine(upperLeft, upperRight, lowerLeft, lowerRight);
        };

        /**
         * Draw a line from one {yaw, pitch} to another {yaw, pitch}
         * @param {Type} fromYawPitch
         * @param {Type} toYawPitch
         * @param {Type} thickness
         */
        function addLeftLine(fromYawPitch, toYawPitch, thickness) {
            var upperLeft = THREE.Math.yawPitchToPoint(fromYawPitch.yaw, fromYawPitch.pitch).add(that.center);
            var upperRight = THREE.Math.yawPitchToPoint(fromYawPitch.yaw + thickness, fromYawPitch.pitch).add(that.center);

            var lowerLeft = THREE.Math.yawPitchToPoint(toYawPitch.yaw, toYawPitch.pitch).add(that.center);
            var lowerRight = THREE.Math.yawPitchToPoint(toYawPitch.yaw + thickness, toYawPitch.pitch).add(that.center);
            
            createLine(upperLeft, upperRight, lowerLeft, lowerRight);

        };
        function addRightLine(fromYawPitch, toYawPitch, thickness) {
            var upperLeft = THREE.Math.yawPitchToPoint(fromYawPitch.yaw - thickness, fromYawPitch.pitch).add(that.center);
            var upperRight = THREE.Math.yawPitchToPoint(fromYawPitch.yaw, fromYawPitch.pitch).add(that.center);

            var lowerLeft = THREE.Math.yawPitchToPoint(toYawPitch.yaw - thickness, toYawPitch.pitch).add(that.center);
            var lowerRight = THREE.Math.yawPitchToPoint(toYawPitch.yaw, toYawPitch.pitch).add(that.center);
            
            createLine(upperLeft, upperRight, lowerLeft, lowerRight);

        };

        
        function createLine(upperLeft, upperRight, lowerLeft, lowerRight) {
            var idxOffset = that.vertices.length;

            // add to geometry
            that.vertices.push(rotate(upperLeft));
            that.vertices.push(rotate(lowerLeft));
            that.vertices.push(rotate(upperRight));
            that.vertices.push(rotate(lowerRight));

            // fornt face
            that.faces.push(new THREE.Face3(0 + idxOffset, 2 + idxOffset, 1 + idxOffset));
            that.faces.push(new THREE.Face3(1 + idxOffset, 2 + idxOffset, 3 + idxOffset));
        };

        // construct
        this.rebuild(args);
    };

    THREE.RectangleOutlineGeometry.prototype = Object.create(THREE.Geometry.prototype);

});