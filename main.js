// WebGL globals
let canvas;
let gl;
let program;
let baseUrl;
let aspectRatio;

// Position, normal, uv, and color data
let vPosition, vPositionBuff;
let vNormal, vNormalBuff;
let vTexture, vTextureBuff;
let vDiffuse, vDiffuseBuff;
let vSpecular, vSpecularBuff;

// Projection and model-view data
let projectionMat, projectionMatLoc;
let modelViewMat, modelViewMatLoc;

// View matrix data
let viewMat;
let eye, at, up;

// Camera model matrix data
let camRotateMat, camTransMat;

// Driving model matrix data
let driveRotateMat;

// Car model matrix data
let carRotateMat, carTransMat;

// Bunny model matrix data
let bunnyTransMat;

// Stop sign model matrix data
let signRotateMat, signTransMat;

// Stack data
let stack;

// Lighting data
let lightPosition, shininess;
let lampLight;

// camera animation variables
let camAnim;
let camRotate;
let camTrans;

// Driving animation variables
let driveAnim;
let driveRotate;

// Texture variables
let texture;
let image;

// Sets up WebGL and enables features that program requiree
function main() {
  // Retrieve canvas element
  canvas = document.getElementById("webgl");

  // Get rendering context for WebGL
  gl = WebGLUtils.setupWebGL(canvas);

  // Check that return value is not null
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Initialize shaders
  program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  // Set viewport and aspect ratio
  gl.viewport(0, 0, canvas.width, canvas.height);
  aspectRatio = canvas.width / canvas.height;

  // Set clear color and enable depth testing
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Keypress event listener
  document.addEventListener("keypress", keypress);

  // Set base URL
  baseUrl = "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/";

  // Initialize constants
  initialize();

  // Configure texture
  configureTexture();

  // Load car mtl and obj files
  loadFile(baseUrl.concat("car.mtl"), "MTL", () => {
    loadFile(baseUrl.concat("car.obj"), "OBJ", () => {
      loadFile(baseUrl.concat("bunny.mtl"), "MTL", () => {
        loadFile(baseUrl.concat("bunny.obj"), "OBJ", () => {
          loadFile(baseUrl.concat("street.mtl"), "MTL", () => {
            loadFile(baseUrl.concat("street.obj"), "OBJ", () => {
              loadFile(baseUrl.concat("stopsign.mtl"), "MTL", () => {
                loadFile(baseUrl.concat("stopsign.obj"), "OBJ", () => {
                  loadFile(baseUrl.concat("lamp.mtl"), "MTL", () => {
                    loadFile(baseUrl.concat("lamp.obj"), "OBJ", () => {
                      render();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function render() {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set initial model-view matrix
  camRotateMat = rotateY(camRotate);
  camTransMat = translate(0.0, camTrans, 0.0);
  modelViewMat = mult(viewMat, camRotateMat);
  modelViewMat = mult(modelViewMat, camTransMat);

  // Draw car
  stack.push(modelViewMat);
  driveRotateMat = rotateY(driveRotate);
  carTransMat = translate(3.0, 0.0, 0.5);
  carRotateMat = rotateY(180.0);
  modelViewMat = mult(modelViewMat, driveRotateMat);
  modelViewMat = mult(modelViewMat, carTransMat);
  modelViewMat = mult(modelViewMat, carRotateMat);
  renderObject(objects[0]);

  // Draw bunny
  stack.push(modelViewMat);
  bunnyTransMat = translate(0.0, 0.7, 1.5);
  modelViewMat = mult(modelViewMat, bunnyTransMat);
  renderObject(objects[1]);
  modelViewMat = stack.pop();
  modelViewMat = stack.pop();

  // Draw street
  stack.push(modelViewMat);
  renderObject(objects[2]);
  modelViewMat = stack.pop();

  // Draw stop sign
  stack.push(modelViewMat);
  signTransMat = translate(4.1, 0.0, -0.5);
  signRotateMat = rotateY(-90);
  modelViewMat = mult(modelViewMat, signTransMat);
  modelViewMat = mult(modelViewMat, signRotateMat);
  renderObject(objects[3]);
  modelViewMat = stack.pop();

  // Draw lamp
  stack.push(modelViewMat);
  renderObject(objects[4]);
  modelViewMat = stack.pop();

  // Camera animation
  if (camAnim) {
    camRotate += 2;
    camTrans = Math.sin(camRotate / 5) / 10;
    requestAnimationFrame(render);
  }

  // Driving animation
  if (driveAnim) {
    driveRotate += 4;
    requestAnimationFrame(render);
  }
}

function renderObject(object) {
  // Create position buffer
  vPositionBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(object.vertices), gl.STATIC_DRAW);

  // Add position data to WebGL
  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Create normal buffer
  vNormalBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(object.normals), gl.STATIC_DRAW);

  // Add normal data to WebGL
  vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  if (object.texture > 0.5) {
    // Create texture buffer
    vTextureBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vTextureBuff);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(object.uvs), gl.STATIC_DRAW);

    // Add texture data to WebGL
    vTexture = gl.getAttribLocation(program, "vTexture");
    gl.vertexAttribPointer(vTexture, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexture);
  }

  // Create diffuse color buffer
  vDiffuseBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vDiffuseBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(object.diffuse), gl.STATIC_DRAW);

  // Add diffuse color data to WebGL
  vDiffuse = gl.getAttribLocation(program, "vDiffuse");
  gl.vertexAttribPointer(vDiffuse, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vDiffuse);

  // Create specular color buffer
  vSpecularBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vSpecularBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(object.specular), gl.STATIC_DRAW);

  // Add specular color data to WebGL
  vSpecular = gl.getAttribLocation(program, "vSpecular");
  gl.vertexAttribPointer(vSpecular, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vSpecular);

  // Get matrix location and add to WebGL
  modelViewMatLoc = gl.getUniformLocation(program, "modelViewMat");
  gl.uniformMatrix4fv(modelViewMatLoc, false, flatten(modelViewMat));

  // Add texture and lamp light booleans to WebGL
  gl.uniform1f(gl.getUniformLocation(program, "textured"), object.texture);
  gl.uniform1f(gl.getUniformLocation(program, "lampLight"), lampLight);

  // Draw object
  gl.drawArrays(gl.TRIANGLES, 0, object.vertices.length);
}

function initialize() {
  // Initialize stack
  stack = [];

  // Set camera animation variables
  camAnim = false;
  camRotate = 0.0;
  camTrans = 0.0;

  // Set driving animation variables
  driveAnim = false;
  driveRotate = 0.0;

  // Set projection matrix
  projectionMat = perspective(45.0, aspectRatio, 0.1, 100.0);

  // Set view matrix
  eye = vec3(0.0, 6.0, 8.0);
  at = vec3(0.0, 0.0, 0.0);
  up = vec3(0.0, 1.0, 0.0);
  viewMat = lookAt(eye, at, up);

  // Get matrix location and add to WebGL
  projectionMatLoc = gl.getUniformLocation(program, "projectionMat");
  gl.uniformMatrix4fv(projectionMatLoc, false, flatten(projectionMat));

  // Set light position, shininess, and lamp light
  lightPosition = vec4(0.0, 3.0, 0.0, 0.0);
  shininess = 20.0;
  lampLight = 1.0;

  // Add light position, shininess, and lamp light to WebGL
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);
  gl.uniform1f(gl.getUniformLocation(program, "lampLight"), lampLight);
}

function configureTexture() {
  var image = new Image();
  image.crossOrigin = "";
  image.src = "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stop.png";
  image.onload = function () {
    texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
  };
}

function keypress(event) {
  let key = event.key;
  switch (key) {
    case "l":
    case "L":
      if (lampLight === 1.0) lampLight = 0.0;
      else lampLight = 1.0;
      break;
    case "c":
    case "C":
      if (camAnim) camAnim = false;
      else camAnim = true;
      break;
    case "m":
    case "M":
      if (driveAnim) driveAnim = false;
      else driveAnim = true;
      break;
    case "d":
    case "D":
      break;
    case "s":
    case "S":
      break;
    case "e":
    case "E":
      break;
    case "r":
    case "R":
      break;
    case "f":
    case "F":
      break;
  }

  // Render scene
  render();
}
