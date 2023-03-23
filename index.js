const { vec2, vec3, mat3, mat4 } = glMatrix;

var elementsArray = [
    "element-1",
    "element-2",
    "element-3",
    "element-4",
    "element-5",
    "element-6",
];

var glContextArray = []

var vertexShaderText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;

    varying vec3 fragColor;

    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    void main(){
        fragColor = vertColor;
        gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }
`

var fragmentShaderText = `
    precision mediump float;

    varying vec3 fragColor;
    
    void main () {
        gl_FragColor = vec4(fragColor, 1.0);
    }
`

var triangleVertices = [
	// X, Y, RGB
	0.0, 0.5, 0.0,     1.0, 1.0, 0.0,
	-0.5, -0.5, 0.0,   0.7,0.0, 1.0,
	0.5, -0.5, 0.0,    0.4, 1.0, 0.6
]

var boxVertices = 
[ // X, Y, Z           R, G, B
    // Top
    -1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
    -1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
    1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
    1.0, 1.0, -1.0,    0.5, 0.5, 0.5,

    // Left
    -1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
    -1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
    -1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
    -1.0, 1.0, -1.0,   0.75, 0.25, 0.5,

    // Right
    1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
    1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
    1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
    1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

    // Front
    1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
    1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
    -1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
    -1.0, 1.0, 1.0,    1.0, 0.0, 0.15,

    // Back
    1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
    1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
    -1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
    -1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

    // Bottom
    -1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
    -1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
    1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
    1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
];

var boxIndices =
[
    // Top
    0, 1, 2,
    0, 2, 3,

    // Left
    5, 4, 6,
    6, 4, 7,

    // Right
    8, 9, 10,
    8, 10, 11,

    // Front
    13, 12, 14,
    15, 14, 12,

    // Back
    16, 17, 18,
    16, 18, 19,

    // Bottom
    21, 20, 22,
    22, 20, 23
];

function moveObject(elementIndex){
    let glElement = glContextArray[elementIndex];
    initialize(glElement);
}

function stopObject(elementIndex){
    let { requestId } = glContextArray[elementIndex];
    cancelAnimationFrame(requestId)
}

async function execute(){
    for(let i = 0; i < elementsArray.length; i++){
        const elementId = elementsArray[i];
        const element = document.getElementById(elementId);

        element.addEventListener('mouseover', () => moveObject(i));
        element.addEventListener('mouseout', () => stopObject(i));

        glContextArray.push(glFactory(elementId));
    }
}

function initialize(glElement){
    let { gl, worldMatrix, matWorldUniformLocation } = glElement;

    let identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    let loop = function (){
        var angle = performance.now() / 1000 / 6 * 2 * Math.PI;

        // rodando o worldMatrix, usando a identityMatrix e o tempo de angle
        // e quero rodar no eixo Y, então por isso  [0,1,0]
        mat4.rotate(worldMatrix, identityMatrix, angle, [0,1,0]);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        // limpando o canva cada loop
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        // desenhando os vertices no canva
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        // loop de renderização;
        glElement.requestId = requestAnimationFrame(loop);
    }

    glElement.requestId = requestAnimationFrame(loop);
}

function glFactory(elementId){
	let canvas = document.getElementById(elementId)
	let gl = canvas.getContext("webgl")

	if(!gl){
		// some browsers does not support the other format
		// like Edge
		gl = canvas.getContext("experimental-webgl")
	}

	// ajustando o canva pra cobrir toda tela
	canvas.width = 350;
	canvas.height = 250;

	// ajustando o GL pra saber que agora ocupa toda tela
	gl.viewport(0,0,350,250);

	// setando a cor pra pintar a tela do canvas
	gl.clearColor(0,0,0,1);
	// limpa o canva inteiro usando a cor que setamos
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.compileShader(vertexShader);

    // para mostrar se ocorreu algum erro de compilação
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.error("erro na compilação", gl.getShaderInfoLog(vertexShader));
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderText);
    gl.compileShader(fragmentShader);

    // para mostrar se ocorreu algum erro de compilação
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.error("erro na compilação", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // linkando o programa ao GL
    gl.linkProgram(program);

	var boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

	var boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    var positionAttrLocation = gl.getAttribLocation(program, 'vertPosition');
    var colorAttrLocation = gl.getAttribLocation(program, 'vertColor');
    
    gl.vertexAttribPointer(
        positionAttrLocation,
        3, // number of elements per attribute
        gl.FLOAT, // type of elements
        gl.FALSE, // data is normalized?
        6 * Float32Array.BYTES_PER_ELEMENT, //size of individual element (cordenadas + 3 valores RGB vezes tamanho em bits de cada numero),
        0, // the position of the first single vertex
    )
    
    gl.vertexAttribPointer(
        colorAttrLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT, // aqui as cores se iniciam no 3 elemento, pois precisamos pular ar cordenadas, entao pulamos 2 vezes tamanho do numero
    )
    
    gl.enableVertexAttribArray(positionAttrLocation);
    gl.enableVertexAttribArray(colorAttrLocation);
    
    // sinalizando openGL state machine que estamos usando esse programa
    gl.useProgram(program);

    // localização desses espaços na memória da GPU
    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
    
    // criando matrizes só com zero
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    
    // criando a matrix identididade das matrizes acima
    mat4.identity(worldMatrix);

    // criando a posição do viewer, como uma camêra
    let view = -10;
    mat4.lookAt(viewMatrix, [0,0,view], [0,0,0], [0,1,0]);

    mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);
    
    // agora vamos enviar essas matrizes para nosso shader
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix)

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // desenhando os vertices no canva
    gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

    return {
        canvas,
        gl,
        vertexShader,
        fragmentShader,
        worldMatrix,
        viewMatrix,
        matWorldUniformLocation,
        matViewUniformLocation,
        view,
        requestId: null
    }
}

function zoomIn(elementIndex){
    let { gl, matViewUniformLocation, viewMatrix } = glContextArray[elementIndex];
    glContextArray[elementIndex].view = glContextArray[elementIndex].view + 1;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    mat4.lookAt(viewMatrix, [0,0, glContextArray[elementIndex].view], [0,0,0], [0,1,0]);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

    gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
}

function zoomOut(elementIndex){
    let { viewMatrix, gl, matViewUniformLocation } = glContextArray[elementIndex];
    glContextArray[elementIndex].view = glContextArray[elementIndex].view - 1;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    mat4.lookAt(viewMatrix, [0,0, glContextArray[elementIndex].view], [0,0,0], [0,1,0]);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

    gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
}