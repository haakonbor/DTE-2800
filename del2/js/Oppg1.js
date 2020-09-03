// Globale variabler:

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec3 a_Position;\n' +		//Dersom vec4 trenger vi ikke vec4(a_Position, 1.0) under.
    'uniform mat4 u_modelviewMatrix;\n' +
    'uniform mat4 u_projectionMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_projectionMatrix * u_modelviewMatrix * vec4(a_Position,1.0);\n' +
    '  gl_PointSize = 4.0;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' + 	// bruker prefiks u_ for å indikere uniform
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' + // Fargeverdi.
    '}\n';

var gl = null;
var canvas = null;

// Verteksbuffer:
var vertexBuffer = null;

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
    // 3 stk 3D vertekser:
    var triangleVertices = new Float32Array([   //NB! ClockWise!!
        -10, -10, 0,
        0, 10, 0,
        10, -10, 0,
        -40,-40, 0,
        -35, 0, 0,
        -30, -40, 0
    ]);

    // Verteksbuffer:
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

    vertexBuffer.itemSize = 3; // NB!!
    vertexBuffer.numberOfItems = 6; // NB!!

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function bindShaderParameters() {
    // Kopler shaderparametre med Javascript-variabler:

    // Farge: u_FragColor (bruker samme farge på alle piksler/fragmenter):
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (u_FragColor < 0) {
        console.log('Fant ikke uniform-parametret u_FragColor i shaderen!?');
        return false;
    }
    var rgba = [ 1, 1, 0, 1.0 ];
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

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
    //modelMatrix.setRotate(45, 0, 0, 1);
    //modelMatrix.scale(2, 2, 2);
    //modelMatrix.translate(30, 30, 2);
    //modelMatrix.setTranslate(-30, 0, 0);

    // Definerer en viewmatrise (kamera):
    // cuon-utils: Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ)
    var eyeX=0, eyeY=0, eyeZ=100;
    var lookX=0, lookY=0, lookZ=0;
    var upX=0, upY=1, upZ=0;
    viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);

    // Slår sammen modell & view til modelview-matrise:
    modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!
    projectionMatrix.setPerspective(50, canvas.width / canvas.height, 99, 1000);
    // Sender matriser til shader:
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);
    gl.drawArrays(gl.POINTS, 0, vertexBuffer.numberOfItems);

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