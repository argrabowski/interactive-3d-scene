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

// Model matrix data
let camRotateMat, camTransMat;
let driveRotateMat;
let carRotateMat, carTransMat;
let bunnyTransMat;
let signRotateMat, signTransMat;
let lampTransMat;

// Stack data
let stack;

// Lighting data
let lightPosition, shininess;
let lampLight;

// Camera animation variables
let camAnim;
let camRotate;
let camTrans;

// Driving animation variables
let driveAnim;
let driveRotate;

// Car camera variables
let carCam;

// Shadow matrix data
let shadowMat;
let shadowTransMat;
let shadowRevTransMat;
let shadowFinTransMat;
let shadowFinScaleMat;
let shadowModelViewMat;
let preModelViewMat;

// Shadow variables
let shadow;
let black;

// Skybox texture variables
let minT;
let maxT;
let texCoord;
let cubeVerts;
let texCoordArr;
let pointsArr;
let nightSky;
let skybox;

// Skybox matrix data
let skyboxTransMat;
let skyboxScaleMat;

// Reflection and refraction data
let car;
let reflect;
let bunny;
let refract;

// Sets up WebGL and enables features that program require
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

  // Set clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);

  // Enable culling
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  // Enable blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // Keypress event listener
  document.addEventListener("keypress", keypress);

  // Set base URL
  baseUrl = "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/";

  // Initialize constants
  initialize();

  // Initialize skybox
  initSkybox();

  // Configure textures
  configureTexSign();
  configureTexSkyNegX();
  configureTexSkyNegY();
  configureTexSkyNegZ();
  configureTexSkyPosX();
  configureTexSkyPosY();
  configureTexSkyPosZ();

  // Configure environment map
  configureCubeMap();

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

  // Check car camera
  if (carCam) {
    // Set view matrix
    eye = vec3(2.7, 0.8, 0.0);
    at = vec3(2.7, 0.8, -0.5);
    up = vec3(0.0, 1.0, 0.0);
    viewMat = lookAt(eye, at, up);
    driveRotateMat = rotateY(-driveRotate);

    // Set initial model-view matrix
    modelViewMat = mult(viewMat, driveRotateMat);
  } else {
    // Set view matrix
    eye = vec3(0.0, 5.0, 8.0);
    at = vec3(0.0, 0.0, 0.0);
    up = vec3(0.0, 1.0, 0.0);
    viewMat = lookAt(eye, at, up);

    // Set initial model-view matrix
    camRotateMat = rotateY(camRotate);
    camTransMat = translate(0.0, camTrans, 0.0);
    modelViewMat = mult(viewMat, camRotateMat);
    modelViewMat = mult(modelViewMat, camTransMat);
  }

  // Draw street
  stack.push(modelViewMat);
  preModelViewMat = modelViewMat;
  renderObject(objects[2]);
  modelViewMat = stack.pop();

  // Draw car
  stack.push(modelViewMat);
  preModelViewMat = modelViewMat;
  driveRotateMat = rotateY(driveRotate);
  modelViewMat = mult(modelViewMat, driveRotateMat);
  modelViewMat = mult(modelViewMat, carTransMat);
  modelViewMat = mult(modelViewMat, carRotateMat);
  renderObject(objects[0]);

  // Draw bunny
  stack.push(modelViewMat);
  preModelViewMat = modelViewMat;
  modelViewMat = mult(modelViewMat, bunnyTransMat);
  renderObject(objects[1]);
  modelViewMat = stack.pop();
  modelViewMat = stack.pop();

  // Draw stop sign
  stack.push(modelViewMat);
  preModelViewMat = modelViewMat;
  modelViewMat = mult(modelViewMat, signTransMat);
  modelViewMat = mult(modelViewMat, signRotateMat);
  renderObject(objects[3]);
  modelViewMat = stack.pop();

  // Draw lamp
  stack.push(modelViewMat);
  preModelViewMat = modelViewMat;
  modelViewMat = mult(modelViewMat, lampTransMat);
  renderObject(objects[4]);
  modelViewMat = stack.pop();

  if (nightSky) {
    // Draw skybox negative-x
    stack.push(modelViewMat);
    skyboxTransMat = translate(-18.0, 0.0, 0.0);
    modelViewMat = mult(modelViewMat, skyboxTransMat);
    modelViewMat = mult(modelViewMat, skyboxScaleMat);
    renderCube(1.0);
    modelViewMat = stack.pop();

    // Draw skybox negative-y
    stack.push(modelViewMat);
    skyboxTransMat = translate(0.0, -18.0, 0.0);
    modelViewMat = mult(modelViewMat, skyboxTransMat);
    modelViewMat = mult(modelViewMat, skyboxScaleMat);
    renderCube(2.0);
    modelViewMat = stack.pop();

    // Draw skybox negative-z
    stack.push(modelViewMat);
    skyboxTransMat = translate(0.0, 0.0, -18.0);
    modelViewMat = mult(modelViewMat, skyboxTransMat);
    modelViewMat = mult(modelViewMat, skyboxScaleMat);
    renderCube(3.0);
    modelViewMat = stack.pop();

    // Draw skybox positive-x
    stack.push(modelViewMat);
    skyboxTransMat = translate(18.0, 0.0, 0.0);
    modelViewMat = mult(modelViewMat, skyboxTransMat);
    modelViewMat = mult(modelViewMat, skyboxScaleMat);
    renderCube(4.0);
    modelViewMat = stack.pop();

    // Draw skybox positive-y
    stack.push(modelViewMat);
    skyboxTransMat = translate(0.0, 18.0, 0.0);
    modelViewMat = mult(modelViewMat, skyboxTransMat);
    modelViewMat = mult(modelViewMat, skyboxScaleMat);
    renderCube(10.0);
    modelViewMat = stack.pop();

    // Draw skybox positive-z
    stack.push(modelViewMat);
    skyboxTransMat = translate(0.0, 0.0, 18.0);
    modelViewMat = mult(modelViewMat, skyboxTransMat);
    modelViewMat = mult(modelViewMat, skyboxScaleMat);
    renderCube(6.0);
    modelViewMat = stack.pop();
  }

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

  // Add sign, lamp light, shadow and skybox booleans to WebGL
  gl.uniform1f(gl.getUniformLocation(program, "sign"), object.texture);
  gl.uniform1f(gl.getUniformLocation(program, "lampLight"), lampLight);
  gl.uniform1f(gl.getUniformLocation(program, "black"), black);
  gl.uniform1f(gl.getUniformLocation(program, "skybox"), skybox);

  // Add car and reflect booleans to WebGL
  if (object.name === "car") {
    car = 1.0;
    gl.uniform1f(gl.getUniformLocation(program, "car"), car);
    car = 0.0;
  } else gl.uniform1f(gl.getUniformLocation(program, "car"), car);
  gl.uniform1f(gl.getUniformLocation(program, "reflect"), reflect);

  // Add bunny and refract booleans to WebGL
  if (object.name === "bunny") {
    bunny = 1.0;
    gl.uniform1f(gl.getUniformLocation(program, "bunny"), bunny);
    bunny = 0.0;
  } else gl.uniform1f(gl.getUniformLocation(program, "bunny"), bunny);
  gl.uniform1f(gl.getUniformLocation(program, "refract"), refract);

  // Add model-view matrix to WebGL
  gl.uniformMatrix4fv(modelViewMatLoc, false, flatten(modelViewMat));

  // Draw object
  gl.drawArrays(gl.TRIANGLES, 0, object.vertices.length);

  // Render shadow
  renderShadow(object);
}

function renderShadow(object) {
  if ((object.name === "car" || object.name === "stopsign") && lampLight > 0.5 && shadow) {
    // Set model-view matrix
    shadowModelViewMat = mult(preModelViewMat, shadowTransMat);
    shadowModelViewMat = mult(shadowModelViewMat, shadowMat);
    shadowModelViewMat = mult(shadowModelViewMat, shadowRevTransMat);

    // Return model transformations for car and stopsign
    switch (object.name) {
      case "car":
        // Model transformations for car
        driveRotateMat = rotateY(driveRotate);
        shadowModelViewMat = mult(shadowModelViewMat, driveRotateMat);
        shadowModelViewMat = mult(shadowModelViewMat, carTransMat);
        shadowModelViewMat = mult(shadowModelViewMat, carRotateMat);
        shadowModelViewMat = mult(shadowModelViewMat, shadowFinTransMat);
        break;
      case "stopsign":
        // Model transformations for stopsign
        shadowModelViewMat = mult(shadowModelViewMat, signTransMat);
        shadowModelViewMat = mult(shadowModelViewMat, signRotateMat);
        break;
    }

    // Add model-view matrix to WebGL
    gl.uniformMatrix4fv(modelViewMatLoc, false, flatten(shadowModelViewMat));

    // Add black to WebGL
    black = 1.0;
    gl.uniform1f(gl.getUniformLocation(program, "black"), black);
    black = 0.0;

    // Draw object and reset black
    gl.drawArrays(gl.TRIANGLES, 0, object.vertices.length);
  }
}

function renderCube(axisNum) {
  // Set skybox and create position buffer
  vPositionBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vPositionBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArr), gl.STATIC_DRAW);

  // Add position data to WebGL
  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Create texture buffer
  vTextureBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vTextureBuff);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordArr), gl.STATIC_DRAW);

  // Add texture data to WebGL
  vTexture = gl.getAttribLocation(program, "vTexture");
  gl.vertexAttribPointer(vTexture, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexture);

  // Add model-view matrix and skybox to WebGL
  gl.uniformMatrix4fv(modelViewMatLoc, false, flatten(modelViewMat));

  // Add skybox to WebGL
  skybox = axisNum;
  gl.uniform1f(gl.getUniformLocation(program, "skybox"), skybox);
  skybox = 0.0;

  // Draw cube
  gl.drawArrays(gl.TRIANGLES, 0, pointsArr.length);
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

  // Get matrix locations and add to WebGL
  modelViewMatLoc = gl.getUniformLocation(program, "modelViewMat");
  projectionMatLoc = gl.getUniformLocation(program, "projectionMat");
  gl.uniformMatrix4fv(projectionMatLoc, false, flatten(projectionMat));

  // Set light position, shininess, and lamp light
  lightPosition = vec4(0.0, 2.5, 0.0, 0.0);
  shininess = 20.0;
  lampLight = 1.0;

  // Add light position, shininess, and lamp light to WebGL
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);
  gl.uniform1f(gl.getUniformLocation(program, "lampLight"), lampLight);

  // Set shadow and black
  shadow = true;
  black = 0.0;

  // Add black to WebGL
  gl.uniform1f(gl.getUniformLocation(program, "black"), black);

  // Set shadow matrix
  shadowMat = mat4();
  shadowMat[3][3] = 0;
  shadowMat[3][1] = -1 / lightPosition[1];

  // Set shadow translate matrices
  shadowTransMat = translate(lightPosition[0], lightPosition[1], lightPosition[2]);
  shadowRevTransMat = translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]);

  // Set skybox texture variables
  minT = 0.0;
  maxT = 1.0;
  texCoord = [vec2(maxT, maxT), vec2(maxT, minT), vec2(minT, minT), vec2(minT, maxT)];
  cubeVerts = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),
  ];
  texCoordArr = [];
  pointsArr = [];
  nightSky = true;
  skybox = 0.0;

  // Add skybox to WebGL
  gl.uniform1f(gl.getUniformLocation(program, "skybox"), skybox);

  // Set car, reflect, bunny, and refract
  car = 0.0;
  reflect = 0.0;
  bunny = 0.0;
  refract = 0.0;

  // Set constant matrices
  carTransMat = translate(3.0, -0.2, 0.5);
  carRotateMat = rotateY(180.0);
  bunnyTransMat = translate(0.0, 0.7, 1.5);
  signTransMat = translate(4.1, 0.0, -0.5);
  signRotateMat = rotateY(-90);
  lampTransMat = translate(0.0, -0.05, 0.0);
  shadowFinTransMat = translate(0.0, -0.05, 0.0);
  shadowFinScaleMat = scalem(1.0, 1.0, 1.0);
  skyboxScaleMat = scalem(18, 18, 18);
}

function initSkybox() {
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
  pointsArr.push(cubeVerts[a]);
  texCoordArr.push(texCoord[0]);

  pointsArr.push(cubeVerts[b]);
  texCoordArr.push(texCoord[1]);

  pointsArr.push(cubeVerts[c]);
  texCoordArr.push(texCoord[2]);

  pointsArr.push(cubeVerts[a]);
  texCoordArr.push(texCoord[0]);

  pointsArr.push(cubeVerts[c]);
  texCoordArr.push(texCoord[2]);

  pointsArr.push(cubeVerts[d]);
  texCoordArr.push(texCoord[3]);
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
      if (carCam) carCam = false;
      else carCam = true;
      break;
    case "s":
    case "S":
      if (shadow) shadow = false;
      else shadow = true;
      break;
    case "e":
    case "E":
      if (nightSky) nightSky = false;
      else nightSky = true;
      break;
    case "r":
    case "R":
      if (reflect === 1.0) reflect = 0.0;
      else reflect = 1.0;
      break;
    case "f":
    case "F":
      if (refract === 1.0) refract = 0.0;
      else refract = 1.0;
      break;
  }

  // Render scene
  render();
}

function configureTexSign() {
  let image = new Image();
  image.crossOrigin = "";
  image.src = baseUrl.concat("stop.png");
  image.onload = function () {
    let texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "signTex"), 0);
  };
}

function configureTexSkyNegX() {
  let image = new Image();
  image.crossOrigin = "";
  image.src = baseUrl.concat("skybox_negx.png");
  image.onload = function () {
    let texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "skyTexNegX"), 1);
  };
}

function configureTexSkyNegY() {
  let image = new Image();
  image.crossOrigin = "";
  image.src = baseUrl.concat("skybox_negy.png");
  image.onload = function () {
    let texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "skyTexNegY"), 2);
  };
}

function configureTexSkyNegZ() {
  let image = new Image();
  image.crossOrigin = "";
  image.src = baseUrl.concat("skybox_negz.png");
  image.onload = function () {
    let texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "skyTexNegZ"), 3);
  };
}

function configureTexSkyPosX() {
  let image = new Image();
  image.crossOrigin = "";
  image.src = baseUrl.concat("skybox_posx.png");
  image.onload = function () {
    let texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "skyTexPosX"), 4);
  };
}

function configureTexSkyPosY() {
  let image = new Image();
  image.crossOrigin = "";
  image.src = baseUrl.concat("skybox_posy.png");
  image.onload = function () {
    let texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "skyTexPosY"), 5);
  };
}

function configureTexSkyPosZ() {
  let image = new Image();
  image.crossOrigin = "";
  image.src = baseUrl.concat("skybox_posz.png");
  image.onload = function () {
    let texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "skyTexPosZ"), 6);
  };
}

function configureCubeMap() {
  let negX = new Image();
  negX.crossOrigin = "";
  negX.src = baseUrl.concat("skybox_negx.png");
  negX.onload = function () {
    let negY = new Image();
    negY.crossOrigin = "";
    negY.src = baseUrl.concat("skybox_negy.png");
    negY.onload = function () {
      let negZ = new Image();
      negZ.crossOrigin = "";
      negZ.src = baseUrl.concat("skybox_negz.png");
      negZ.onload = function () {
        let posX = new Image();
        posX.crossOrigin = "";
        posX.src = baseUrl.concat("skybox_posx.png");
        posX.onload = function () {
          let posY = new Image();
          posY.crossOrigin = "";
          posY.src = baseUrl.concat("skybox_posy.png");
          posY.onload = function () {
            let posZ = new Image();
            posZ.crossOrigin = "";
            posZ.src = baseUrl.concat("skybox_posz.png");
            posZ.onload = function () {
              let texture = gl.createTexture();

              gl.activeTexture(gl.TEXTURE7);
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

              gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

              gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, negX);
              gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, negY);
              gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, negZ);
              gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, posX);
              gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, posY);
              gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, posZ);

              gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
              gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

              gl.uniform1i(gl.getUniformLocation(program, "texMap"), 7);
            };
          };
        };
      };
    };
  };
}
