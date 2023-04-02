var elementsCartArray = [];
var glContextArray = [];
var loadedObjects = [];
var currentElement = null;
var currentGlElement = null;
var elementsArray = [
    {
      id: "element-1",
      obj: "gun.obj",
      texture: "gun-texture.png",
      title: "Submachine Gun M24"
    },
    {
      id: "element-2",
      obj: "box.obj",
      texture: "box-texture.png",
      title: "Wood block"
    },
    {
      id: "element-3",
      obj: "gun.obj",
      texture: "gun-texture.png",
      title: "Submachine Gun M24"
    },
    {
      id: "element-4",
      obj: "box.obj",
      texture: "diamond-texture.png",
      title: "Diamond block"
    },
    {
      id: "element-5",
      obj: "gun.obj",
      texture: "gun-texture.png",
      title: "Submachine Gun M24"
    },
    {
      id: "element-6",
      obj: "box.obj",
      texture: "iron-texture.png",
      title: "Iron block"
    }
];

async function initializeHome(){
  for(let i = 0; i < elementsArray.length; i++){
    const canvaElement = elementsArray[i];
    const element = document.getElementById(canvaElement.id);

    const response = await fetch('/resources/' + canvaElement.obj);
    const text = await response.text();
    const data = parseOBJ(text);

    element.addEventListener('mouseover', () => moveObject(i));
    element.addEventListener('mouseout', () => stopObject(i));

    glContextArray.push(elementFactory(canvaElement.id, canvaElement.texture, data, 350, 250));
  }
}

async function initializeCart(){
  const { gl, canvas, meshProgramInfo } = createProgram("cart");
  let buffers = [];

  canvas.width = 600;
  canvas.height = 500;

  gl.viewport(0,0,600,500);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const cameraTarget = [0, 1, 0];
  const cameraPosition = [0, 0, 6];
  const zNear = 0.1;
  const zFar = 50;

  const fieldOfViewRadians = degToRad(60);
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
  const up = [0, 1, 0];
  const camera = m4.lookAt(cameraPosition, cameraTarget, up);
  const view = m4.inverse(camera);

  let cartElementsArray = JSON.parse(localStorage.getItem('cartElements'))
  for(let i = 0; i < cartElementsArray.length; i++){
    const element = cartElementsArray[i];
    let bufferIndex = buffers.findIndex(buffer => buffer.name === element.obj);

    if(bufferIndex < 0){
      const response = await fetch('/resources/' + element.obj);
      const text = await response.text();
      data = parseOBJ(text);

      const { vao, bufferInfo } = createBuffer(gl, data, meshProgramInfo);
      bufferIndex = buffers.push({
        name: element.obj,
        data: bufferInfo,
        vao: vao
      }) - 1;
    }

    let bufferInfo = buffers[bufferIndex].data;
    let vao = buffers[bufferIndex].vao;

    const tex = twgl.createTexture(gl, {
      src: "/resources/" + element.texture,
    });

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
      u_world: m4.yRotation(14),
      u_diffuse: [1, 0.7, 0.5, 1],
      u_texture: tex,
    };

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.useProgram(meshProgramInfo.program);

    twgl.setUniforms(meshProgramInfo, sharedUniforms);

    gl.bindVertexArray(vao);
    
    twgl.drawBufferInfo(gl, bufferInfo);
  }
}

function moveObject(elementIndex){
    let glElement = glContextArray[elementIndex];
    initializeLoop(glElement);
}

function stopObject(elementIndex){
  let { requestId } = glContextArray[elementIndex];
  cancelAnimationFrame(requestId);
}

function zoomIn(){
  let { gl, bufferInfo, cameraPosition, meshProgramInfo, cameraTarget, projection } = currentGlElement;
  currentGlElement.cameraPosition[2] = currentGlElement.cameraPosition[2] - 1;

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

function zoomOut(){
  let { gl, bufferInfo, cameraPosition, meshProgramInfo, cameraTarget, projection } = currentGlElement;
  currentGlElement.cameraPosition[2] = currentGlElement.cameraPosition[2] - 1;

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

function initializeLoop(glElement){
    let { gl, meshProgramInfo, bufferInfo } = glElement;

    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    function loop() {
      let time = performance.now() / 1000 / 6 * 2 * Math.PI;  // convert to seconds
  
      twgl.setUniforms(meshProgramInfo, {
        u_world: m4.yRotation(time)
      });
  
      twgl.drawBufferInfo(gl, bufferInfo);
  
      glElement.requestId = requestAnimationFrame(loop);
    }

    glElement.requestId = requestAnimationFrame(loop);
}

function elementFactory(elementId, texturePath, data, width, height){
  const { gl, meshProgramInfo, canvas } = createProgram(elementId);

  canvas.width = width;
  canvas.height = height;
  
  gl.viewport(0,0,width,height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  twgl.setAttributePrefix("a_");

  const { vao, bufferInfo } = createBuffer(gl, data, meshProgramInfo);

  const tex = twgl.createTexture(gl, {
    src: "/resources/" + texturePath,
  });

  const cameraTarget = [0, 0, 0];
  const cameraPosition = [0, 0, 6];
  const zNear = 0.1;
  const zFar = 50;

  twgl.resizeCanvasToDisplaySize(gl.canvas);

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

  let glElement = {
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

  initializeLoop(glElement);
  setTimeout(() => {
    cancelAnimationFrame(glElement.requestId)
  }, 100)

  return glElement;
}

async function openElement(elementIndex){
  currentElement = elementsArray[elementIndex];

  let modal = document.getElementById("modal");
  modal.style.display = "flex";

  let modalTitle = document.getElementById("modal-title");
  modalTitle.innerHTML = currentElement.title;

  const response = await fetch('/resources/' + currentElement.obj);
  const text = await response.text();
  const data = parseOBJ(text);

  currentGlElement = elementFactory("modal-canva", currentElement.texture, data, 400, 400);

  initializeLoop(currentGlElement);
}

function addToCart(){
  elementsArray = JSON.parse(localStorage.getItem("cartElements"))
  elementsCartArray.push(currentElement);
  console.log(currentElement, elementsArray)
  localStorage.setItem("cartElements", JSON.stringify(elementsCartArray));
  closeModal();
}

function createProgram(elementId){
  var canvas = document.getElementById(elementId)
	var gl = canvas.getContext("webgl2")

	if(!gl){
		gl = canvas.getContext("experimental-webgl")
	}

  const meshProgramInfo = twgl.createProgramInfo(gl, [vertexShaderText, fragmentShaderText]);

  return {
    meshProgramInfo,
    gl,
    canvas
  }
}

function createBuffer(gl, data, meshProgramInfo){
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);

  return {
    bufferInfo,
    vao
  }
}