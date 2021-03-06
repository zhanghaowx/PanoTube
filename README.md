# Panorama.js

A light-weight library for viewing panorama images.

## Examples

Code example in examples folder. Live example can be found [here](http://zhanghaowx.github.io/Panorama.js).

## Build a Minified Version

```bash
npm install -g requirejs # run once
r.js -o build/app.build.js
```

## Usage

### HTML

```html
<div id="pano"></div>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script>
```

### JavaScript

1. Use a single 360° panorama image as source:

  ```javascript
  $(".panorama").panorama({
      type: 'sphere',
      tiles: ["images/panoramas/indoor.jpg"]
  });
  ```

2. Use a list of tiles:

  Sometimes the 360° image may be sliced into tiles to improve loading. The library also supports image tiles.

  ### Cube Map Images

  ```javascript
  $(".panorama").panorama({
      type: 'cube',
      tiles: [
          'images/tiles/42762724_r8_f0_x0_y0.jpg',    //front
          'images/tiles/42762724_r8_f1_x0_y0.jpg',    //right
          'images/tiles/42762724_r8_f2_x0_y0.jpg',    //back
          'images/tiles/42762724_r8_f3_x0_y0.jpg',    //left
          'images/tiles/42762724_r8_f4_x0_y0.jpg',    //bottom
          'images/tiles/42762724_r8_f5_x0_y0.jpg'     //top
      ]
  });
  ```

  ### Equirectangular Images

  ```javascript
  $(".panorama").panorama({
      tiles: [
          "images/tiles/panoId&zoom=2&x=0&y=0",     // top-left
          "images/tiles/panoId&zoom=2&x=1&y=0",
          "images/tiles/panoId&zoom=2&x=2&y=0",
          "images/tiles/panoId&zoom=2&x=3&y=0",
          "images/tiles/panoId&zoom=2&x=0&y=1",
          "images/tiles/panoId&zoom=2&x=1&y=1",
          "images/tiles/panoId&zoom=2&x=2&y=1",
          "images/tiles/panoId&zoom=2&x=3&y=1"      // bottom-right
      ],
      rows: Math.pow(2, zoom - 1),
      columns: Math.pow(2, zoom),
  });
  ```
