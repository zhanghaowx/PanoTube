define(["lib/three", "core/Object3D"], function() {
    // This set of controls performs orbiting, and zooming. It maintains
    // the "up" direction as +Y. Touch on tablet and phones is supported.
    //
    //    Orbit - left mouse / touch: one finger move
    //    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
    //
    THREE.OrbitControls = function(camera, domElement) {
        this.camera = camera;
        this.domElement = (domElement !== undefined) ? domElement : document;

        // API

        // create a projection to convert between 2D and 3D points
        this.projector = new THREE.Projector();

        // Set false to disable this control
        this.enabled = true;

        // Set false to disable zoom in/out
        this.noZoom = false;
        this.zoomSpeed = 0.1;

        // Limits how far you can zoom in/out
        this.minFov = 30;
        this.maxFov = 90;

        // Set to true to automatically rotate around the target
        this.autoRotate = false;
        this.autoRotateSpeed = 0.5; // 12 seconds per round when fps is 60

        // Camera yaw, pitch, and roll(not allowed)
        this.yaw = -90; // facing north by default
        this.pitch = 0;

        // List of selectable objects
        this.selectable = [];

		// List of selected objects
		this.selected = [];

        // Internals
        var that = this;

        var isUserRotating = false;
        var isUserSelect = false;

        var onMouseDownMouseX = 0;
        var onMouseDownMouseY = 0;
        var onMouseDownLon = 0;
        var onMouseDownLat = 0;

        this.update = function() {
            if (that.autoRotate && !isUserRotating && !isUserSelect) {
                that.yaw += that.autoRotateSpeed;
            }

			that.yaw = (that.yaw + 180 + 360) % 360 - 180; // adjust yaw's value to [-180, 180]
            that.pitch = Math.max(-85, Math.min(85, that.pitch)); // adjust pitch's value to [-85, 85]

            var theta = THREE.Math.degToRad(that.yaw);
            var phi = THREE.Math.degToRad(90 - that.pitch);

            var target = new THREE.Vector3();
            target.x = Math.sin(phi) * Math.cos(theta);
            target.y = Math.cos(phi);
            target.z = Math.sin(phi) * Math.sin(theta);

            that.camera.lookAt(target);
        };

        /**
         * Converts mouse click positions into a 3D coordinates
         */
        var getMouseCoordinates = function(event) {
            // create mouse point in Normalized Device Coordinate (NDC) Space
            var domElement = that.domElement;
            var point = new THREE.Vector3(((event.clientX - domElement.offsetLeft) / domElement.width) * 2 - 1,
                    -((event.clientY - domElement.offsetTop) / domElement.height) * 2 + 1, 0.5);
            that.projector.unprojectVector(point, that.camera);
			point.normalize();
            return point;
        };

        /**
         * Computes intersects of mouse clicks with any selectable objects
         */
        var computeIntersects = function(event, callbacks) {
            var mouse = getMouseCoordinates(event);
            var intersects = (new THREE.Raycaster(that.camera.position,
                mouse.sub(that.camera.position).normalize())).intersectObjects(that.selectable, true);

            if(intersects.length > 0) {
                if(callbacks.succeed) {
                    callbacks.succeed(intersects);
                }
            } else {
                if(callbacks.fail) {
                    callbacks.fail();
                }
            }
        };

        var onMouseDown = function(event) {
            if(that.enabled === false) {
                return;
            }

            event.preventDefault();
            computeIntersects(event, {
                succeed: function(intersects) { // some objects are clicked
                    isUserSelect = true;

					// notify all objects of mouse down
					for(var i = 0; i < intersects.length; i++) {
						var object = intersects[i].object;
						var point = intersects[i].point
						object.onMouseDown(point, true);
						that.selected.push(object);
					}
                },
                fail: function() {	// no object is clicked
                    isUserRotating = true;

                    onMouseDownMouseX = event.clientX;
                    onMouseDownMouseY = event.clientY;

                    onMouseDownLon = that.yaw;
                    onMouseDownLat = that.pitch;
                }
            });

            that.domElement.addEventListener('mousemove', that.onMouseMove,  false);
        };

        var onMouseMove = function(event) {
            if(that.enabled === false) {
                return;
            }
            event.preventDefault();

            if (isUserSelect === true) {
				// notify all objects of mouse move
				for(var i = 0; i < that.selected.length; i++) {
					that.selected[i].onMouseMove(getMouseCoordinates(event), false);
				}
            } else if (isUserRotating === true) {
                that.yaw = (onMouseDownMouseX - event.clientX) * 0.1 + onMouseDownLon;
                that.pitch = (event.clientY - onMouseDownMouseY) * 0.1 + onMouseDownLat;
            }
        };

        var onMouseUp = function(event) {
            if(that.enabled === false) {
                return;
            }
            event.preventDefault();

            isUserRotating = false;
            isUserSelect = false;

			// notify all objects of mouse up
			for(var i = 0; i < that.selected.length; i++) {
				that.selected[i].onMouseUp(getMouseCoordinates(event), false);
			}

			that.selected = [];

            that.domElement.removeEventListener('mousemove', that.onMouseMove,  false);
        };

        var onMouseWheel = function(event) {
            if(that.enabled === false || that.noZoom === true) {
                return;
            }
            event.preventDefault();

            var delta = that.zoomSpeed;
            // WebKit
            if (event.wheelDeltaY) {
                that.camera.fov -= event.wheelDeltaY * delta;
                // Opera / Explorer 9
            } else if (event.wheelDelta) {
                that.camera.fov -= event.wheelDelta * delta;
                // Firefox
            } else if (event.detail) {
                that.camera.fov -= event.detail * delta;
            }

            if (that.camera.fov > that.maxFov) {
                that.camera.fov = that.maxFov;
            }
            if (that.camera.fov < that.minFov) {
                that.camera.fov = that.minFov;
            }

            that.camera.updateProjectionMatrix();
        };

        var onTouchStart = function(event) {
            if(that.enabled === false) {
                return;
            }
            event.preventDefault();

            if (event.touches.length == 1) { // one-fingered touch: rotate
                onMouseDownMouseX = event.touches[0].pageX;
                onMouseDownMouseY = event.touches[0].pageY;

                onMouseDownLon = that.yaw;
                onMouseDownLat = that.pitch;
            }
        };

        var onTouchMove = function(event) {
            if(that.enabled === false) {
                return;
            }
            event.preventDefault();

            if (event.touches.length == 1) { // one-fingered touch: rotate
                that.yaw = (onMouseDownMouseX - event.touches[0].pageX)
                    * 0.1 + onMouseDownLon;
                that.pitch = (event.touches[0].pageY - onMouseDownMouseY)
                    * 0.1 + onMouseDownLat;
            }
        };

        var onTouchEnd = function(event) {
            if(that.enabled === false) {
                return;
            }
            event.preventDefault();
        };

        // mouse events
        this.domElement.addEventListener('mouseup', onMouseUp, false);
        this.domElement.addEventListener('mousedown', onMouseDown, false);
        this.domElement.addEventListener('mousemove', onMouseMove, false);
        this.domElement.addEventListener('mousewheel', onMouseWheel, false);
        this.domElement.addEventListener('DOMMouseScroll', onMouseWheel, false);

        this.domElement.addEventListener('touchstart', onTouchStart, false);
        this.domElement.addEventListener('touchend', onTouchEnd, false);
        this.domElement.addEventListener('touchmove', onMouseMove, false);

    };

    THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );

});