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
    var vertexReturn = initVertexBuffers(gl);

    //Rensker skjermen:
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tegner linjer:
    gl.drawArrays(gl.LINES, 0, vertexReturn.lineVertices);

    // Tegner trekanter:
    gl.drawArrays(gl.TRIANGLES, vertexReturn.lineVertices, vertexReturn.n - vertexReturn.lineVertices);

}

function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        1.0, 0.0, 0.0,      // X-linje vertekser
        -1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,      // Y-linje vertekser
        0.0, -1.0, 0.0,
        1.0, 0.0, 0.0,      // X-trekant vertekser
        0.96, 0.02, 0.0,
        0.96, -0.02, 0.0,
        -1.0, 0.0, 0.0,
        -0.96, 0.02, 0.0,
        -0.96, -0.02, 0.0,
        0.0, 1.0, 0.0,      // Y-trekant vertekser
        0.02, 0.96, 0.0,
        -0.02, 0.96, 0.0,
        0.0, -1.0, 0.0,
        0.02, -0.96, 0.0,
        -0.02, -0.96, 0.0,
        -0.8, 0.3, 0.0,     // Pil vertekser, 4 trekanter til sammen
        -0.5, 0.0, 0.0,
        0.5, 0.3, 0.0,
        -0.8, -0.3, 0.0,
        -0.5, 0.0, 0.0,
        0.5, -0.3, 0.0,
        -0.5, 0.0, 0.0,
        0.5, 0.3, 0.0,
        0.5, -0.3, 0.0,
        0.5, 0.7, 0.0,
        0.5, -0.7, 0.0,
        0.9, 0.0, 0.0
    ]);

    // Aksefarger
    var axisColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,     // X-akse linje (rød)
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,     // Y-akse linje (grønn)
        0.0, 1.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,     // X-akse trekanter (rød)
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,     // Y-akse trekanter (grønn)
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,     // Pil, 4 trekanter til sammen (blå)
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
    ]);

    var n = vertices.length / 3;
    var lineVertices = 4;

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
    gl.bufferData(gl.ARRAY_BUFFER, axisColors, gl.STATIC_DRAW);

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

    return {n: n, lineVertices: lineVertices,};
}