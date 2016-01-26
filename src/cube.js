define(["here/here.cube"], function () {
    $.fn.cube = function (options) {
        var name = "hereCube";
        var cube = $(this).data(name);
        if (cube) {
            cube.clearPanorama();
            cube.loadPanorama(options);
        } else {
            var cube = new HERE.Cube3D(this);
            cube.loadPanorama(options);
            $(this).data(name, cube);
        }
        return cube;
    };
});
