({
    baseUrl: "../src",
    paths: {
        // local dependencies
        here: 'here',
        core: 'core',
        tool: 'tool',
        controls: 'controls',
        geometries: 'geometries',
        // 3rd libraries
        three: '../node_modules/three/three.min',
        datGui: 'https://github.com/dataarts/dat.gui/releases/download/v0.5.1/dat.gui.min',
    },
    mainConfigFile: "../examples/requirejs-config.js",
    name: "cube",
    out: "cube.min.js"
})
