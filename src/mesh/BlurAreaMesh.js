define(["threejs/three", "geometries/RectangleGeometry"], function () {

    /**
     * Create a mesh for the blur area
     */
    THREE.BlurAreaMesh = function (yaw, pitch, widthInDeg, heightInDeg, offset) {

        this.parameters = {};

        this.cameraPosition = new THREE.Vector3();

        /**
         * Limits of width and height
         */
        this.minWidth = 0.5;
        this.maxWidth = 180;

        this.minHeight = 0.5;
        this.maxHeight = 180;

        this.minPitch = -90;
        this.maxPitch = 90;

        /**
         * Offset in degrees that the blur area needs to be away from north/south pole
         */
        this.offset = offset;

        this.onMouseDown = function (point) {
            this.material.color.setHex(0xffff00);
            this.yawPitchOffset = getYawPitchOffset(point);
            this.isMoving = true;
        };

        this.onMouseMove = function (point) {
            if (this.isMoving) {
                moveRectangleMesh(point);
                moveControllers();
            }
        };

        this.onMouseUp = function (point) {
            this.material.color.setHex(0xffffff);
            this.yawPitchOffset = null;
            this.isMoving = false;
        };

        /**
         * Add a resize controller
         */
        this.controllerMeshes = [];
        this.addControllers = function () {
            // create circle mesh for four resize controllers
            var corners = this.rectangleGeometry.corners;

            for (var i = 0; i < corners.length; i++) {
                var position = corners[i];

                var circleMaterial = new THREE.MeshBasicMaterial({
                    color: "#ffffff"
                });

                // circle has radius of 0.01 and segments of 16
                var circleMesh = new THREE.Mesh(new THREE.CircleGeometry(0.01, 16), circleMaterial);
                circleMesh.position = position;
                circleMesh.lookAt(this.cameraPosition);

                // hook up mouse events
                circleMesh.onMouseDown = function () {
                    this.material.color.setHex(0xffff00);
                    this.isResizing = true;
                };
                circleMesh.onMouseMove = function (point) {
                    if (this.isResizing) {
                        resizeRectangleMesh(this.position, point);
                        moveControllers();
                    }
                };
                circleMesh.onMouseUp = function () {
                    this.material.color.setHex(0xffffff);
                    this.isResizing = false;
                };

                this.controllerMeshes.push(circleMesh);

                this.children.push(circleMesh);
            }
        };

        /**
         * Rebuild the mesh with a new set of parameters
         */
        this.rebuild = function(parameters) {
            setupParameters(parameters.yaw, parameters.pitch, parameters.widthInDeg, parameters.heightInDeg);
            rebuildRectangleGeometry();
            moveControllers(); // move controllers should come after rebuilding geometry
        };

        // Internals
        var that = this;

        /**
         * Resize the rectangle mesh
         */
        var resizeRectangleMesh = function (originalPoint, newPoint) {

            var thisYawPitch = THREE.Math.pointToYawPitch(revertRotate(originalPoint.clone()));
            var thatYawPitch = THREE.Math.pointToYawPitch(revertRotate(newPoint.clone()));

            var newYaw = that.parameters.yaw + (thatYawPitch.yaw - thisYawPitch.yaw) / 2.0;
            var newPitch = that.parameters.pitch + (thatYawPitch.pitch - thisYawPitch.pitch) / 2.0;

            var newWidth = Math.abs((thisYawPitch.yaw + thatYawPitch.yaw));
            var newHeight = Math.abs(thisYawPitch.pitch + thatYawPitch.pitch);

            newHeight = Math.min((that.parameters.pitch - that.minPitch - that.offset) * 2.0, newHeight);
            newHeight = Math.min((that.maxPitch - that.parameters.pitch - that.offset) * 2.0, newHeight);

            setupParameters(newYaw, newPitch, newWidth, newHeight);

            rebuildRectangleGeometry();
        }

        /**
         * Move meshes
         */
        var moveRectangleMesh = function (point, yawPitchOffset) {
            var yawPitch = THREE.Math.pointToYawPitch(point);

            var yaw = yawPitch.yaw - that.yawPitchOffset.yaw;
            var pitch = yawPitch.pitch - that.yawPitchOffset.pitch;

            setupParameters(yaw, pitch);

            rebuildRectangleGeometry();
        };

        /**
         * Move the four controllers to the new corners
         */
        var moveControllers = function () {
            var rectCorners = that.rectangleGeometry.corners;

            for (var i = 0; i < that.controllerMeshes.length; i++) {
                var child = that.controllerMeshes[i];

                child.position = rectCorners[i % rectCorners.length];
                child.lookAt(that.cameraPosition);

                child.geometry.verticesNeedUpdate = true;
                child.geometry.normalsNeedUpdate = true;

                child.geometry.computeFaceNormals();
                child.geometry.computeVertexNormals();
                child.geometry.computeBoundingSphere();
            }
        }

        var rebuildRectangleGeometry = function() {
            that.rectangleGeometry.rebuild(that.parameters);
        }

        /**
         * Get yaw and pitch offset from mouse down position to area center
         */
        var getYawPitchOffset = function (point) {
            var mouseDownYawPitch = THREE.Math.pointToYawPitch(point);
            return {
                yaw: mouseDownYawPitch.yaw - that.parameters.yaw,
                pitch: mouseDownYawPitch.pitch - that.parameters.pitch
            }
        };

        /**
         * Revert the above rotate
         * @param {Type}
         */
        function revertRotate(v) {
            var minusZAxis = new THREE.Vector3(0, 0, -1);
            var yAxis = new THREE.Vector3(0, 1, 0);

            v.applyAxisAngle(yAxis, THREE.Math.degToRad(that.parameters.yaw));
            v.applyAxisAngle(minusZAxis, THREE.Math.degToRad(that.parameters.pitch));

            return v;
        }


        var setupParameters = function (yaw, pitch, widthInDeg, heightInDeg) {
            if (yaw != null) {
                that.parameters.yaw = yaw;
            }

            if (pitch != null) {
                that.parameters.pitch = Math.min(that.maxPitch, Math.max(that.minPitch, pitch));
            }

            if (widthInDeg != null) {
                that.parameters.heightInDeg = Math.min(that.maxHeight, Math.max(that.minHeight, heightInDeg));
            }

            if (heightInDeg != null) {
                that.parameters.widthInDeg = Math.min(that.maxWidth, Math.max(that.minWidth, widthInDeg));
            }

            correctParameters();
        };

        var correctParameters = function() {
            that.parameters.pitch = Math.min(that.maxPitch - that.parameters.heightInDeg / 2.0 - that.offset, Math.max(that.minPitch + that.parameters.heightInDeg / 2.0 + that.offset, that.parameters.pitch));
        };


        setupParameters(yaw, pitch, widthInDeg, heightInDeg);

        // construct
        var meshMaterial = new THREE.MeshBasicMaterial({
            color: "#ffffff",
            transparent: true,
            opacity: 0.5,
            overdraw: 0.1,
            side: THREE.DoubleSide
        });
        this.rectangleGeometry = new THREE.RectangleGeometry(this.parameters);

        THREE.Mesh.call(this, this.rectangleGeometry, meshMaterial);
    };

    THREE.BlurAreaMesh.prototype = Object.create(THREE.Mesh.prototype);

});
