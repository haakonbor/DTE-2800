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

var colorBuffer = null;

// "Pekere" som brukes til å sende matrisene til shaderen:
var u_modelviewMatrix = null;
var u_projectionMatrix = null;

// Matrisene:
var modelMatrix = null;
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

    var vertices = new Float32Array([   //NB! ClockWise!!
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
        1, 1, -1,    // Høyre side
        1, -1, 1,
        1, -1, -1,
        -1, -1, -1,
        -1, -1, 1,
        -1, 1, -1,
        -1, 1, 1


    ]);

    var colors = new Float32Array([
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

    // Verteksbuffer:
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    vertexBuffer.itemSize = 3; // NB!!
    vertexBuffer.numberOfItems = vertices.length / 3; // NB!!

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Fargebuffer:
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

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

    // Kobler fra farge-bufferobjektet:
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

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Posisjon: a_Position
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Definerer modellmatrisa (translasjon):
    modelMatrix.setIdentity();//
    modelMatrix.setRotate(45, 0, 0, 1);
    //modelMatrix.scale(0.5, 0.5, 0.5);
    modelMatrix.translate(6, 0, -8);
    console.log(modelMatrix);

    // Definerer en viewmatrise (kamera):
    // cuon-utils: Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ)
    var eyeX=0, eyeY=0, eyeZ=30;
    var lookX=0, lookY=0, lookZ=0;
    var upX=0, upY=1, upZ=0;
    viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);

    // Slår sammen modell & view til modelview-matrise:
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    projectionMatrix.setPerspective(50, canvas.width / canvas.height, 10, 1000);
    // Sender matriser til shader:
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numberOfItems);


    /*
    //Tegner på nytt:
    modelMatrix.setTranslate(10, 10, 0);
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numberOfItems);


    //Tegner på nytt:
    modelMatrix.setTranslate(10, 13, 0);
    modelMatrix.rotate(45, 0, 0, 1);
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numberOfItems);
    */
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