// Vertex shader program.
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' + 	// Setter posisjon
    '  v_Color = a_Color;\n' + 	        // Videresender fargen
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +         // Mottas via varying-parameteret i verteksshaderen. Interpolert verdi
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +     // Fargeverdi.
    '}\n';

function main() {
    // Hent <canvas> elementet
    var canvas = document.getElementById('webgl');

    // Rendering context for WebGL:
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Fikk ikke tak i rendering context for WebGL');
        return;
    }
    // Initialiser shadere:
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Feil ved initialisering av shaderkoden.');
        return;
    }

    // Initialiserer verteksbuffer:
    var n = initVertexBuffers(gl);

    /*
    // Kobler til fargeattributt:
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (u_FragColor < 0) {
        console.log('Fant ikke uniform-parametret u_FragColor i shaderen!?');
        return;
    }
    var rgba = [1.0, 1.0, 0.0, 1.0];
    //Sender inn fargeverdi:
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    */

    //Rensker skjermen:
    gl.clearColor(0.0, 7.0, 0.4, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tegner trekanter:
    let i;
    for (i = 0; i <= n - 3; i += 3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }

}

function initVertexBuffers(gl) {
    // 9 stk 3D vertekser (med z-verdier lik 0, ala 2D vertekser):
    var vertices = new Float32Array([
        0.7, 0.5, 0,
        -0.5, -0.9, 0,
        0.5, -0.5, 0,
        -0.3, 0.6, 0,
        -0.1, -0.9, 0,
        0.5, -0.8, 0,
        0.9, 0.6, 0,
        0.9, -0.7, 0,
        0.6, -0.8, 0
    ]);

    var colors = new Float32Array([
        1.0, 0.0, 1.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.6, 0.3, 0, 1.0,
        0.9, 0.3, 0.2, 1.0,
        1.0, 1.0, 1.0, 1.0
    ])

    var n = vertices.length / 3; // Antall vertekser, hver verteks består av 3 floats.

    // Oppretter et posisjons-bufferobjekt:
    var positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
        console.log('Fikk ikke laget et bufferobjekt!?');
        return -1;
    }
    // Oppretter et farge-bufferobjekt:
    var colorBuffer = gl.createBuffer();
    if (!colorBuffer) {
        console.log('Fikk ikke laget et bufferobjekt!?');
        return -1;
    }


    // POSISJON
    // Binder posisjons-bufferobjektet:
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Skriver til posisjons-bufferobjektet:
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Finner posisjonen til a_Position i shaderen:
    var posAttrib = gl.getAttribLocation(gl.program, 'a_Position');
    if (posAttrib < 0) {
        console.log('Fant ikke parametret a_Position i shaderen!?');
        return -1;
    }
    // Koble verteksattributtet til posisjons-bufferobjektet:
    var floatsPerVertex = 3;
    gl.vertexAttribPointer(posAttrib, floatsPerVertex, gl.FLOAT, false, 0, 0);

    // Enabler verteksshaderattributtpekeren:
    gl.enableVertexAttribArray(posAttrib);

    // Kobler fra posisjons-bufferobjektet:
    gl.bindBuffer(gl.ARRAY_BUFFER, null);


    // FARGE
    // Binder farge-bufferobjektet:
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Skriver til farge-bufferobjektet:
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    // Finner posisjonen til a_Color i shaderen:
    var colorAttrib = gl.getAttribLocation(gl.program, 'a_Color');
    if (colorAttrib < 0) {
        console.log('Fant ikke parametret a_Color i shaderen!?');
        return -1;
    }
    // Koble verteksattributtet til farge-bufferobjektet:
    floatsPerVertex = 4;
    gl.vertexAttribPointer(colorAttrib, floatsPerVertex, gl.FLOAT, false, 0, 0);

    // Enabler verteksshaderattributtpekeren:
    gl.enableVertexAttribArray(colorAttrib);

    // Kobler fra farge-bufferobjektet:
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}
