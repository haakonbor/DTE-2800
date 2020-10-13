"use strict";
/*
    Tegner koordinatsystemet.
*/

class MyCoord {

    constructor(gl) {
        this.gl = gl;
        this.coordPositionBuffer = null;
        this.coordColorBuffer = null;
        this.COORD_BOUNDARY = 1000;
    }

    init() {
        let coordPositions = new Float32Array([
            //x-aksen
            -COORD_BOUNDARY, 0.0, 0.0,
            COORD_BOUNDARY, 0.0, 0.0,

            //y-aksen:
            0.0, COORD_BOUNDARY, 0.0,
            0.0, -COORD_BOUNDARY, 0.0,

            //z-aksen:
            0.0, 0.0, COORD_BOUNDARY,
            0.0, 0.0, -COORD_BOUNDARY,
        ]);

        // Verteksbuffer for koordinatsystemet:
        this.coordPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, coordPositions, this.gl.STATIC_DRAW);
        this.coordPositionBuffer.itemSize = 3; 		// NB!!
        this.coordPositionBuffer.numberOfItems = 6; 	// NB!!
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);	// NB!! M� kople fra n�r det opereres med flere buffer! Kopler til i draw().

        // Fargebuffer: oppretter, binder og skriver data til bufret:
        let coordColors = new Float32Array([
            1.0, 0.0, 0.0, 1,   // X-akse
            1.0, 0.0, 0.0, 1,
            0.0, 1.0, 0.0, 1,   // Y-akse
            0.0, 1.0, 0.0, 1,
            0.0, 0.0, 1.0, 1,   // Z-akse
            0.0, 0.0, 1.0, 1
        ]);
        coordColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, coordColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, coordColors, this.gl.STATIC_DRAW);
        coordColorBuffer.itemSize = 4; 			// 4 float per farge.
        coordColorBuffer.numberOfItems = 6; 	// 6 farger.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    draw() {
        setupCamera();

        modelMatrix.setIdentity();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coordPositionBuffer);
        let a_Position = this.gl.getAttribLocation(this.gl.program, "a_Position");
        this.gl.vertexAttribPointer(a_Position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(a_Position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, coordColorBuffer);
        let a_Color = this.gl.getAttribLocation(this.gl.program, "a_Color");
        this.gl.vertexAttribPointer(a_Color, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(a_Color);

        modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkef�lge!
        this.gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
        this.gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);
        this.gl.drawArrays(this.gl.LINES, 0, this.coordPositionBuffer.numberOfItems);
    }
}


