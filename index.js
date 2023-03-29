var elementsArray = [
    {
      id: "element-1",
      obj: "gun.obj",
      texture: "gun-texture.png"
    },
    {
      id: "element-2",
      obj: "box.obj",
      texture: "box-texture.png"
    },
    {
      id: "element-3",
      obj: "gun.obj",
      texture: "gun-texture.png"
    },
    {
      id: "element-4",
      obj: "box.obj",
      texture: "box-texture.png"
    },
    {
      id: "element-5",
      obj: "gun.obj",
      texture: "gun-texture.png"
    },
    {
      id: "element-6",
      obj: "box.obj",
      texture: "box-texture.png"
    }
];

var glContextArray = []

var vertexShaderText = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;
  in vec2 a_texcoord;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  out vec2 v_texcoord;

  void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_texcoord = a_texcoord;
  }
`

var fragmentShaderText = `#version 300 es
  precision mediump float;

  in vec2 v_texcoord;

  uniform sampler2D u_texture;

  out vec4 outColor;

  void main () {
    outColor = texture(u_texture, v_texcoord);
  }
`

function moveObject(elementIndex){
    let glElement = glContextArray[elementIndex];
    initializeLoop(glElement);
}

function stopObject(elementIndex){
  let { requestId } = glContextArray[elementIndex];
  cancelAnimationFrame(requestId)
}

function degToRad(deg) {
  return deg * Math.PI / 180;
}

async function executeProgram(){
  for(let i = 0; i < elementsArray.length; i++){
    const canvaElement = elementsArray[i];
    const element = document.getElementById(canvaElement.id);

    const response = await fetch('/resources/' + canvaElement.obj);
    const text = await response.text();
    const data = parseOBJ(text);

    element.addEventListener('mouseover', () => moveObject(i));
    element.addEventListener('mouseout', () => stopObject(i));

    glContextArray.push(glFactory(canvaElement.id, canvaElement.texture, data));
  }
}

function initializeLoop(glElement){
    let { gl, meshProgramInfo, bufferInfo } = glElement;

    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    function loop(time) {
      time = performance.now() / 1000 / 6 * 2 * Math.PI;  // convert to seconds
  
      twgl.setUniforms(meshProgramInfo, {
        u_world: m4.yRotation(time)
      });
  
      twgl.drawBufferInfo(gl, bufferInfo);
  
      glElement.requestId = requestAnimationFrame(loop);
    }

    glElement.requestId = requestAnimationFrame(loop);
}

function glFactory(elementId, texturePath, data){
	var canvas = document.getElementById(elementId)
	var gl = canvas.getContext("webgl2")

	if(!gl){
		gl = canvas.getContext("experimental-webgl")
	}

	canvas.width = 350;
	canvas.height = 250;

	gl.viewport(0,0,350,250);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  twgl.setAttributePrefix("a_");

  const meshProgramInfo = twgl.createProgramInfo(gl, [vertexShaderText, fragmentShaderText]);

  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);

  const tex = twgl.createTexture(gl, {
    src: "/resources/" + texturePath,
  });

  const cameraTarget = [0, 0, 0];
  const cameraPosition = [0, 0, 6];
  const zNear = 0.1;
  const zFar = 50;

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const fieldOfViewRadians = degToRad(60);
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

  const up = [0, 1, 0];
  // Compute the camera's matrix using look at.
  const camera = m4.lookAt(cameraPosition, cameraTarget, up);

  // Make a view matrix from the camera matrix.
  const view = m4.inverse(camera);

  const sharedUniforms = {
    u_lightDirection: m4.normalize([-1, 3, 5]),
    u_view: view,
    u_projection: projection,
    u_world: m4.yRotation(14),
    u_diffuse: [1, 0.7, 0.5, 1],
    u_texture: tex,
  };
  
  gl.useProgram(meshProgramInfo.program);

  twgl.setUniforms(meshProgramInfo, sharedUniforms);

  gl.bindVertexArray(vao);
  
  twgl.drawBufferInfo(gl, bufferInfo);

  return {
    gl,
    requestId: null,
    view,
    camera,
    projection,
    zNear,
    zFar,
    cameraTarget,
    cameraPosition,
    bufferInfo,
    meshProgramInfo,
    tex
  }
}

function zoomIn(elementIndex){
  let { gl, bufferInfo, cameraPosition, meshProgramInfo, cameraTarget, projection } = glContextArray[elementIndex];
  glContextArray[elementIndex].cameraPosition[2] = glContextArray[elementIndex].cameraPosition[2] - 1;

  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

  const camera = m4.lookAt(cameraPosition, cameraTarget, [0, 1, 0]);

  const view = m4.inverse(camera);
  
  const sharedUniforms = {
    u_lightDirection: m4.normalize([-1, 3, 5]),
    u_view: view,
    u_projection: projection,
  };
  
  twgl.setUniforms(meshProgramInfo, sharedUniforms);

  twgl.drawBufferInfo(gl, bufferInfo);
}

function zoomOut(elementIndex){
  let { gl, bufferInfo, cameraPosition, meshProgramInfo, cameraTarget, projection } = glContextArray[elementIndex];
  glContextArray[elementIndex].cameraPosition[2] = glContextArray[elementIndex].cameraPosition[2] + 1;

  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

  const camera = m4.lookAt(cameraPosition, cameraTarget, [0, 1, 0]);

  const view = m4.inverse(camera);
  
  const sharedUniforms = {
    u_lightDirection: m4.normalize([-1, 3, 5]),
    u_view: view,
    u_projection: projection,
  };
  
  twgl.setUniforms(meshProgramInfo, sharedUniforms);

  twgl.drawBufferInfo(gl, bufferInfo);
}