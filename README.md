# Interactive 3D Scene

## Overview
This project is a WebGL-based 3D graphics application designed to render and display 3D models. It includes an OBJ file parser for loading 3D models along with their associated materials and textures. The application utilizes JavaScript and WebGL to create an interactive and visually engaging 3D scene.

## Features
- **OBJ File Parsing:** The project includes a parser for OBJ files, extracting vertex positions, normals, UV coordinates, and material information.
- **Material and Texture Handling:** The application supports the loading and handling of material properties, including diffuse and specular colors. It also supports associating texture files with materials.
- **Hierarchical Modeling:** The scene rendering involves hierarchical modeling, allowing for complex objects and animations.
- **Interactive Controls:** Users can interact with the scene using keyboard controls, enabling features such as toggling lamp light, camera animation, and driving animation.

## Project Structure
The project is structured as follows:
- **HTML:** The main HTML file (`index.html`) includes the WebGL setup and shader scripts.
- **JavaScript:**
  - The main application logic is in `main.js`, which orchestrates the rendering and animation.
  - The OBJ file parser is implemented in `parser.js`.
- **Shaders:** Vertex and fragment shaders are included in the HTML file (`vshader` and `fshader`).
- **Libraries:** External JavaScript libraries (`webgl-utils.js`, `initShaders.js`, `MV.js`) are used for WebGL utility functions.

## Controls
- **Toggle Lamp Light:** Press `L` to toggle lamp light on/off.
- **Toggle Camera Animation:** Press `C` to toggle camera animation.
- **Toggle Driving Animation:** Press `M` to toggle driving animation.
