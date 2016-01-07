// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
requirejs.config({
    //By default load any module IDs from src
    baseUrl: '../src',
    //paths config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        lib: 'lib',
        here: 'here',
        core: 'core',
        tool: 'tool',
        controls: 'controls',
        geometries: 'geometries'
    },
    //Remember: only use shim config for non-AMD scripts,
    //scripts that do not already call define(). The shim
    //config will not work correctly if used on AMD scripts,
    //in particular, the exports and init config will not
    //be triggered, and the deps config will be confusing
    //for those cases.
    shim: {

    }
});