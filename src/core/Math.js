define(["threejs/three"], function () {

    /**
     * Convert yaw, pitch to a point on the surface of a sphere
     * @param {Type} yawInDegrees
     * @param {Type} pitchInDegrees
     */
    THREE.Math.yawPitchToPoint = function (yawInDegrees, pitchInDegrees) {
        var yaw = THREE.Math.degToRad(yawInDegrees);
        var pitch = THREE.Math.degToRad(pitchInDegrees);

        var vector = new THREE.Vector3();
        vector.x = Math.cos(pitch) * Math.cos(yaw);
        vector.y = Math.sin(pitch);
        vector.z = Math.cos(pitch) * Math.sin(yaw);
        vector.normalize();

        return vector;
    };

    /**
     * Covert a screen point to yaw,pitch
     */
    THREE.Math.pointToYawPitch = function (point) {
        var direction = new THREE.Vector3();
        direction.add(point).normalize();

        var yaw = THREE.Math.radToDeg(Math.atan2(direction.z, direction.x));
        var pitch = THREE.Math.radToDeg(Math.asin(direction.y));

        return {
            yaw: yaw,
            pitch: pitch
        };
    };
});
