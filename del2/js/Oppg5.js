/* ----------------GLOBALE VARIABLER-------------- */

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec3 a_Position;\n' +		//Dersom vec4 trenger vi ikke vec4(a_Position, 1.0) under.
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'uniform mat4 u_modelviewMatrix;\n' +
    'uniform mat4 u_projectionMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_projectionMatrix * u_modelviewMatrix * vec4(a_Position,1.0);\n' +
    '  v_Color = a_Color;\n' + 	        // Videresender fargen
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +         // Mottas via varying-parameteret i verteksshaderen. Interpolert verdi
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +     // Fargeverdi.
    '}\n';

var gl = null;
var canvas = null;

// Verteksbuffer:
var vertexBuffer = null;
var plane_vertexBuffer = null;

var colorBuffer = null;
var plane_colorBuffer = null;

// "Pekere" som brukes til å sende matrisene til shaderen:
var u_modelviewMatrix = null;
var u_projectionMatrix = null;

// Matrisene:
let modelMatrix = null;
var viewMatrix = null;
var modelviewMatrix = null; //sammenslått modell- og viewmatrise.
var projectionMatrix = null;

function init() {
    // Hent <canvas> elementet
    canvas = document.getElementById('webgl');

    // Rendering context for WebGL:
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Fikk ikke tak i rendering context for WebGL');
        return false;
    }

    modelMatrix = new Matrix4();
    viewMatrix = new Matrix4();
    modelviewMatrix = new Matrix4();
    projectionMatrix = new Matrix4();

    return true;
}

function initBuffer() {

    var vertices = new Float32Array([
        -1, 1, 1,       // Front, bakdel, topp og bunn
        1, 1, 1,
        -1, -1, 1,
        1, -1, 1,
        -1, -1, -1,
        1, -1, -1,
        -1, 1, -1,
        1, 1, -1,
        -1, 1, 1,
        1, 1, 1,
        1, 1, -1,       // Høyre side
        1, -1, 1,
        1, -1, -1,
        -1, -1, -1,
        -1, -1, 1,
        -1, 1, -1,
        -1, 1, 1
    ]);

    var plane_vertices = new Float32Array([
        //-10, -2, 10,
        //10, -2, 20,
        //-10, -2, 10,
        1000, -5, -1000,
        -1000, -5, -1000,
        1000, -5, 1000,
        -1000, -5, 1000,
        //-1000, -3, 1000,
        //-1000, -3, 1000
    ]);

    var colors = new Float32Array([
        1,1,1,1,
        1,1,1,1,
        1, 1, 1, 1.0,
        1, 1, 1, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,

    ]);

    var plane_colors = new Float32Array ([
        0,1,0,1,
        0,1,0,1,
        0,1,0,1,
        0,1,0,1
    ]);

    // Verteksbuffer kubemann:
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    vertexBuffer.itemSize = 3; // NB!!
    vertexBuffer.numberOfItems = vertices.length / 3; // NB!!

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Verteksbuffer plan:
    plane_vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plane_vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, plane_vertices, gl.STATIC_DRAW);

    plane_vertexBuffer.itemSize = 3; // NB!!
    plane_vertexBuffer.numberOfItems = 4; // NB!!

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Fargebuffer:
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    /*
    // Finner posisjonen til a_Color i shaderen:
    var colorAttrib = gl.getAttribLocation(gl.program, 'a_Color');
    if (colorAttrib < 0) {
        console.log('Fant ikke parametret a_Color i shaderen!?');
        return -1;
    }
    // Koble verteksattributtet til farge-bufferobjektet:
    gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);

    // Enabler verteksshaderattributtpekeren:
    gl.enableVertexAttribArray(colorAttrib);
    */

    // Kobler fra farge-bufferobjektet:
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    plane_colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, plane_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, plane_colors, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function bindShaderParameters() {
    // Kopler shaderparametre med Javascript-variabler:

    // Matriser: u_modelviewMatrix & u_projectionMatrix
    u_modelviewMatrix = gl.getUniformLocation(gl.program, 'u_modelviewMatrix');
    u_projectionMatrix = gl.getUniformLocation(gl.program, 'u_projectionMatrix');

    return true;
}

function draw() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    // BackfaceCulling:
    /*
	gl.frontFace(gl.CW);		//indikerer at trekanter med vertekser angitt i CW er front-facing!
	gl.enable(gl.CULL_FACE);	//enabler culling.
	gl.cullFace(gl.BACK);		//culler baksider.
    */

    /* PLANET */
    gl.bindBuffer(gl.ARRAY_BUFFER, plane_vertexBuffer);
    // Posisjon: a_Position
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);


    gl.bindBuffer(gl.ARRAY_BUFFER, plane_colorBuffer);
    // Finner posisjonen til a_Color i shaderen:
    var colorAttrib = gl.getAttribLocation(gl.program, 'a_Color');
    if (colorAttrib < 0) {
        console.log('Fant ikke parametret a_Color i shaderen!?');
        return -1;
    }
    // Koble verteksattributtet til farge-bufferobjektet:
    gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);

    // Enabler verteksshaderattributtpekeren:
    gl.enableVertexAttribArray(colorAttrib);

    modelMatrix.setIdentity();//
    // Definerer en viewmatrise (kamera):
    // cuon-utils: Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ)
    var eyeX=5, eyeY=5, eyeZ=30;
    var lookX=0, lookY=-5, lookZ=0;
    var upX=0, upY=1, upZ=0;
    viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);
    console.log("VIEWMATRIX",viewMatrix);

    // Slår sammen modell & view til modelview-matrise:
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    projectionMatrix.setPerspective(50, canvas.width / canvas.height, 1, 1000);
    // Sender matriser til shader:
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, plane_vertexBuffer.numberOfItems);

    //gl.bindBuffer(gl.ARRAY_BUFFER, null);

    /* KUBEMANNEN */
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Finner posisjonen til a_Color i shaderen:
    colorAttrib = gl.getAttribLocation(gl.program, 'a_Color');
    if (colorAttrib < 0) {
        console.log('Fant ikke parametret a_Color i shaderen!?');
        return -1;
    }
    // Koble verteksattributtet til farge-bufferobjektet:
    gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);

    // Enabler verteksshaderattributtpekeren:
    gl.enableVertexAttribArray(colorAttrib);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Posisjon: a_Position
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Definerer modellmatrisa (translasjon):
    modelMatrix.setIdentity();//
    //modelMatrix.scale(0.5, 0.5, 0.5);
    //modelMatrix.translate(-1,2,0);
    //modelMatrix.rotate(45, 0, 0, 1);
    console.log(modelMatrix);

    // Definerer en viewmatrise (kamera):
    // cuon-utils: Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ)
    var eyeX=5, eyeY=5, eyeZ=30;
    var lookX=0, lookY=-5, lookZ=0;
    var upX=0, upY=1, upZ=0;
    viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);
    console.log("VIEWMATRIX",viewMatrix);

    // Slår sammen modell & view til modelview-matrise:
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    projectionMatrix.setPerspective(50, canvas.width / canvas.height, 1, 1000);
    // Sender matriser til shader:
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);

    //Tegner hals:
	modelMatrix.setTranslate(0, -1.2, 0);
	modelMatrix.scale(0.5,0.3,0.5);
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
	gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);

    //Tegner torso:
    modelMatrix.setTranslate(0, -11, 0);
    modelMatrix.scale(4,10,3);
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);

    //Tegner høyre bein:
    modelMatrix.setTranslate(-0.7, -1.5, 0);
    modelMatrix.rotate(-30,0,0,1);
    modelMatrix.scale(0.2,0.8,0.5);
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);

    //Tegner venstre bein
    modelMatrix.setIdentity();
    modelMatrix.scale(5,1/0.8,2);
    modelMatrix.rotate(30,0,0,1);
	modelMatrix.translate(1.4, 0, 0);
	modelMatrix.rotate(30, 0, 0, 1);
	modelMatrix.scale(0.2,0.8,0.5);
	modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    console.log(modelMatrix)
	gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);

    //Tegner venstre arm
    modelMatrix.setIdentity();
    modelMatrix.scale(5,1/0.8,2);
    modelMatrix.rotate(-30,0,0,1);
    modelMatrix.translate(1, 1.7, 0);
    modelMatrix.rotate(45, 0, 0, 1);
    modelMatrix.scale(0.1,1,0.25);
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    console.log(modelMatrix)
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);

    //Tegner venstre arm
    modelMatrix.setIdentity();
    modelMatrix.scale(10,1,4);
    modelMatrix.rotate(-45,0,0,1);
    modelMatrix.translate(-3.4, 1.2, 0);
    modelMatrix.rotate(-135, 0, 0, 1);
    modelMatrix.scale(0.1,1,0.25);
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    console.log(modelMatrix)
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);
}

function main() {

    if (!init())
        return;

    // Initialiser shadere (cuon-utils):
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Feil ved initialisering av shaderkoden.');
        return;
    }

    // Initialiserer verteksbuffer:
    initBuffer();

    // Binder shaderparametre:
    if (!bindShaderParameters())
        return;

    // Setter bakgrunnsfarge:
    gl.clearColor(0.3, 0.2, 0.4, 1.0); //RGBA

    // Tegn!
    draw();
}