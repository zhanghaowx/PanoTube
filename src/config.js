// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
requirejs.config({
    paths: {
        // 3rd libraries
        three: '//cdnjs.cloudflare.com/ajax/libs/three.js/r79/three.min',
        dat_gui: '//cdnjs.cloudflare.com/ajax/libs/dat-gui/0.5.1/dat.gui.min'
    },
});
