/*
* Kode basert på "CubeDiffusePointLight1.js" av Werner Farstad,
* koden er omgjort til en klasse-implementasjon av lyskilden, og andre småjusteringer er gjort.
* */

class LightSource {
    constructor(gl, camera, canvas) {
        this.gl = gl;
        this.camera = camera;
        this.canvas = canvas;

        this.lightSourcePositionBuffer = null;
        this.pointLightPos = {x: -100, y:100, z:100};
        this.generalLightColor = {r: 0.2, g: 0.2, b: 0.2};
        this.pointLightColor = {r: 1.0, g: 1.0, b: 1.0};
    }

    init(vertexShaderName, fragmentShaderName) {
        let vertexShaderSource = document.getElementById(vertexShaderName).innerHTML;
        let fragmentShaderSource = document.getElementById(fragmentShaderName).innerHTML;
        this.shaderProgram= createProgram(this.gl, vertexShaderSource,fragmentShaderSource);
        if (!this.shaderProgram)
            console.log('Feil ved initialisering av shaderkoden til lyskilden.');
        else
            this.initBuffers()
    }

    initBuffers() {
        let cubePositions = new Float32Array([
            //Forsiden (pos):
            -1, 1, 1,
            -1,-1, 1,
            1,-1, 1,

            -1,1,1,
            1, -1, 1,
            1,1,1,

            //H�yre side:
            1,1,1,
            1,-1,1,
            1,-1,-1,

            1,1,1,
            1,-1,-1,
            1,1,-1,

            //Baksiden (pos):
            1,-1,-1,
            -1,-1,-1,
            1, 1,-1,

            -1,-1,-1,
            -1,1,-1,
            1,1,-1,

            //Venstre side:
            -1,-1,-1,
            -1,1,1,
            -1,1,-1,

            -1,-1,1,
            -1,1,1,
            -1,-1,-1,

            //Topp:
            -1,1,1,
            1,1,1,
            -1,1,-1,

            -1,1,-1,
            1,1,1,
            1,1,-1,

            //Bunn:
            -1,-1,-1,
            -1,-1,1,
            1,-1,1,

            -1,-1,-1,
            1,-1,1,
            1,-1,-1
        ]);

        this.lightSourcePositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lightSourcePositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, cubePositions, this.gl.STATIC_DRAW);
        this.lightSourcePositionBuffer.itemSize = 3;
        this.lightSourcePositionBuffer.numberOfItems = 36;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    handleKeys(elapsed, currentlyPressedKeys) {
        // LYSKILDENS POSISJON:
        // x-pos:
        if (currentlyPressedKeys[89]) {     //Y
            this.pointLightPos.x += 2;
        }
        if (currentlyPressedKeys[85]) {	    //U
            this.pointLightPos.x -= 2;
        }
        //y-pos
        if (currentlyPressedKeys[72]) {    //H
            this.pointLightPos.y += 2;
        }
        if (currentlyPressedKeys[74]) {	//J
            this.pointLightPos.y -= 2;
        }
        //z-pos
        if (currentlyPressedKeys[78]) {    //H
            this.pointLightPos.z += 2;
        }
        if (currentlyPressedKeys[77]) {	//J
            this.pointLightPos.z -= 2;
        }
    }

    draw(modelMatrix) {
        this.gl.useProgram(this.shaderProgram);

        // Posisjon:
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lightSourcePositionBuffer);
        let a_Position = this.gl.getAttribLocation(this.shaderProgram, "a_Position");
        this.gl.vertexAttribPointer(a_Position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(a_Position);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        //Kopler til fragmentshader-fargeattributt:
        let u_FragColor = this.gl.getUniformLocation(this.shaderProgram, 'u_FragColor');
        let rgba = [254.0/256, 250.0/256, 37.0/256, 1.0];  // gult!
        this.gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Kamera & matriser:
        this.camera.setCamera();
        modelMatrix.setIdentity();
        modelMatrix.translate(this.pointLightPos.x, this.pointLightPos.y, this.pointLightPos.z);
        modelMatrix.scale(1.0, 1.0, 1.0);

        let modelviewMatrix = this.camera.getModelViewMatrix(modelMatrix);

        let u_modelviewMatrix = this.gl.getUniformLocation(this.shaderProgram, 'u_modelviewMatrix');
        let u_projectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'u_projectionMatrix');
        this.gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
        this.gl.uniformMatrix4fv(u_projectionMatrix, false, this.camera.projectionMatrix.elements);

        // Tegner:
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.lightSourcePositionBuffer.numberOfItems);
    }
}



