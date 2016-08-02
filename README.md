# Panorama

[Panorama](https://en.wikipedia.org/wiki/Panorama), as the name implies, is a library for viewing panorama images.

## Examples
Code example in examples folder.
Live example can be found [here](http://zhanghaowx.github.io/panorama.html).

## Install Dependencies
```
npm install
```

## Build a Minified Version
```
r.js -o build/app.build.js
```

## Usage

### HTML

```html
<div id="pano"></div>
```

### JavaScript

1. Use a single 360° panorama image as source:

    ```javascript
    $("#pano").panorama({
        texture: "images/panoramas/indoor.jpg"
    });
    ```
2. Use a list of 6, 24, 96, or 384 tiles:

    Sometimes the 360° image may be sliced into tiles to improve loading. The library also supports it.

    ```javascript
    $("#pano").panorama({
        tiles: [
            'images/tiles/42762724_r8_f0_x0_y0.jpg',
            'images/tiles/42762724_r8_f1_x0_y0.jpg',
            'images/tiles/42762724_r8_f2_x0_y0.jpg',
            'images/tiles/42762724_r8_f3_x0_y0.jpg',
            'images/tiles/42762724_r8_f4_x0_y0.jpg',
            'images/tiles/42762724_r8_f5_x0_y0.jpg'
        ]
    });
    ```
