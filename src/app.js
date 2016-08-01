define(["scene/Cube3D"], function (Cube3D) {
    $.fn.cube = function (options) {
        var name = "cube3D";
        var cube = $(this).data(name);
        if (cube) {
            cube.clearPanorama();
            cube.loadPanorama(options);
        } else {
            var cube = new Cube3D(this);
            cube.loadPanorama(options);
            $(this).data(name, cube);
        }
        return cube;
    };
});
