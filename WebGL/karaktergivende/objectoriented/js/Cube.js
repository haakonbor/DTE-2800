"use strict";
/*
* Kode basert på "Cube.js" av Werner Farstad,
* man kan nå oppgi hvilken shaderkode som skal brukes, og kuben har fått både tesktur og interagerer med lys
* */
class Cube {
    constructor(gl, camera, canvas) {
        this.gl = gl;
        this.camera = camera;
        this.canvas = canvas;

        this.positionBuffer = null;
        this.normalBuffer = null;
        this.textureBuffer = null;

        this.readyToDraw = false;
    }

    init(vertexShaderName, fragmentShaderName, texturePath, textureType) {
        this.textureType = textureType;

        let vertexShaderSource = document.getElementById(vertexShaderName).innerHTML;
        let fragmentShaderSource = document.getElementById(fragmentShaderName).innerHTML;
        this.shaderProgram= createProgram(this.gl, vertexShaderSource,fragmentShaderSource);
        if (!this.shaderProgram)
            console.log('Feil ved initialisering av shaderkoden til kuben.');
        else {
            this.loadTexture(texturePath);
        }

    }

    loadTexture(texturePath) {
        const image = new Image();
        // onload-event:
        image.onload = ()=> {
            if (this.isPowerOfTwo(image.width) && this.isPowerOfTwo(image.height)) {
                this.initBuffers(image);
                this.readyToDraw = true;
            }
            else
                alert("Teksturens høyde og/eller bredde er ikke POT!");

        }
        // onerror-event:
        image.onerror = ()=> {
            alert("Finner ikke : " + texturePath);
        }
        // starter nedlasting:
        image.src = texturePath;
    }

    // Sjekker om value er POT
    isPowerOfTwo(value) {
        return (value & (value - 1)) == 0;  //?
    }

    initBuffers(textureImage) {
        //KUBEN:
        //36 stk posisjoner:
        let positions = new Float32Array([
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

        // NORMALVEKTORER:
        var normals = new Float32Array([
            //Forsiden:
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            //H�yre side:
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            //Baksiden:
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            //Venstre side:
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,

            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,

            //Topp
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            //Bunn:
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0
        ]);

        let UVs = null;

        // Basic tekstur
        if (this.textureType === "basicTexture") {
            // Teksturkoordinater / UV-koordinater:
            UVs = new Float32Array([
                //Forsiden:
                0,1,
                0,0,
                1,0,

                0,1,
                1,0,
                1,1,

                //H�yre side:
                0,1,
                0,0,
                1,0,

                0,1,
                1,0,
                1,1,

                //Baksiden:
                0,0,
                1,0,
                0,1,

                1,0,
                1,1,
                0,1,

                //Venstre side:
                0,0,
                1,1,
                0,1,

                1,0,
                1,1,
                0,0,

                //Topp
                0,0,
                1,0,
                0,1,

                0,1,
                1,0,
                1,1,

                //Bunn:
                1,1,
                0,0,
                1,0,

                1,1,
                0,1,
                0,0
            ]);
        }

        // Hus base
        else if (this.textureType === "houseBase") {
            // Teksturkoordinater / UV-koordinater:
            UVs = new Float32Array([
                //Forsiden:
                0.375, 0.75,
                0.375, 0.375,
                0.625, 0.375,

                0.375, 0.75,
                0.625, 0.375,
                0.625, 0.75,

                //H�yre side:
                0.625, 0.75,
                0.625, 0.375,
                1, 0.375,

                0.625, 0.75,
                1, 0.375,
                1, 0.75,

                //Baksiden:
                0.375, 0,
                0.625, 0,
                0.375 ,0.375,

                0.625, 0,
                0.625, 0.375,
                0.375, 0.375,

                //Venstre side:
                0, 0.375,
                0.375, 0.75,
                0,0.75,

                0.375, 0.375,
                0.375, 0.75,
                0, 0.375,

                //Topp (bruker bare forsiden på nytt siden den ikke er synlig)
                0.375, 0.75,
                0.375, 0.375,
                0.625, 0.375,

                0.375, 0.75,
                0.625, 0.375,
                0.625, 0.75,

                //Bunn: (bruker bare forsiden på nytt siden den ikke er synlig)
                0.375, 0.75,
                0.375, 0.375,
                0.625, 0.375,

                0.375, 0.75,
                0.625, 0.375,
                0.625, 0.75,
            ]);
        }

        // Hus tak
        else if (this.textureType === "houseRoof") {
            // Teksturkoordinater / UV-koordinater:
            UVs = new Float32Array([
                //Forsiden:
                0, 0.3125,
                0, 0,
                0.375, 0,

                0, 0.3125,
                0.375, 0,
                0.375, 0.3125,

                //H�yre side:
                0, 0.3125,
                0, 0,
                0.375, 0,

                0, 0.3125,
                0.375, 0,
                0.375, 0.3125,

                //Baksiden:
                0, 0,
                0.375, 0,
                0, 0.3125,

                0.375, 0,
                0.375, 0.3125,
                0, 0.3125,

                //Venstre side:
                0, 0,
                0.375, 0.3125,
                0, 0.3125,

                0.375, 0,
                0.375, 0.3125,
                0, 0,

                //Topp
                0, 0,
                0.375, 0,
                0, 0.3125,

                0, 0.3125,
                0.375, 0,
                0.375, 0.3125,

                //Bunn:
                0.375, 0.3125,
                0, 0,
                0.375, 0,

                0.375, 0.3125,
                0, 0.3125,
                0, 0
            ]);
        }


        // Posisjonsbuffer:
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        this.positionBuffer.itemSize = 3; 		// NB!!
        this.positionBuffer.numberOfItems = 36;	// NB!!
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);	// NB!! M� kople fra n�r det opereres med flere buffer! Kopler til i draw().

        // Normalvektorbuffer
        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.STATIC_DRAW);
        this.normalBuffer.itemSize = 3;
        this.normalBuffer.numberOfItems = 36;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        //TEKSTUR-RELATERT:
        this.texture = this.gl.createTexture();
        //Teksturbildet er nå lastet fra server, send til GPU:
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        //Unngaa at bildet kommer opp-ned:
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);   //NB! FOR GJENNOMSIKTIG BAKGRUNN!! Sett også gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        //Laster teksturbildet til GPU/shader:
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, textureImage);

        // NB! Dette gjør at bildet kan ha vilkårlig bredde og høyde.
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);   //<==
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        this.textureBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, UVs, this.gl.STATIC_DRAW);
        this.textureBuffer.itemSize = 2;
        this.textureBuffer.numberOfItems = 36;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    handleKeys(elapsed) {
        // implementeres ved behov
    }

    draw(modelMatrix, light) {     //HER!!
        if (!this.readyToDraw)
            return;

        this.gl.useProgram(this.shaderProgram);


        // Posisjon:
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        let a_Position = this.gl.getAttribLocation(this.shaderProgram,'a_Position');
        this.gl.vertexAttribPointer(a_Position, this.positionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(a_Position);


        // Tekstur:
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
        let a_TextureCoord = this.gl.getAttribLocation(this.shaderProgram, "a_TextureCoord");
        this.gl.vertexAttribPointer(a_TextureCoord, this.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(a_TextureCoord);
        //Aktiver teksturenhet (0):
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        //Send inn verdi som indikerer hvilken teksturenhet som skal brukes (her 0):
        let samplerLoc = this.gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.gl.uniform1i(samplerLoc, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);


        // Normalvektor:
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        let a_Normal = this.gl.getAttribLocation(this.shaderProgram, 'a_Normal');
        if (a_Normal !== -1) {  //-1 dersom a_Normal ikke er i bruk i shaderen.
            this.gl.vertexAttribPointer(a_Normal, this.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(a_Normal);
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        // Lys
        let u_LightPos = this.gl.getUniformLocation(this.shaderProgram, 'u_lightPosition');
        let u_DiffuseLightColor = this.gl.getUniformLocation(this.shaderProgram, 'u_diffuseLightColor');
        let u_AmbientLightColor = this.gl.getUniformLocation(this.shaderProgram, 'u_ambientLightColor');

        let lightPosition = [light.pointLightPos.x, light.pointLightPos.y, light.pointLightPos.z];
        let diffuseLightColor = [light.pointLightColor.r, light.pointLightColor.g, light.pointLightColor.b];
        let ambientLightColor = [light.generalLightColor.r, light.generalLightColor.g, light.generalLightColor.b];

        //Gi verdi til lysvariablene:
        this.gl.uniform3fv(u_LightPos, lightPosition);
        this.gl.uniform3fv(u_DiffuseLightColor, diffuseLightColor);
        this.gl.uniform3fv(u_AmbientLightColor, ambientLightColor);

        // Kopler matriseshaderparametre med tilsvarende Javascript-variabler:
        let u_normalMatrix = this.gl.getUniformLocation(this.shaderProgram, 'u_normalMatrix');
        let u_modelMatrix = this.gl.getUniformLocation(this.shaderProgram, 'u_modelMatrix');
        let u_modelviewMatrix = this.gl.getUniformLocation(this.shaderProgram, "u_modelviewMatrix");
        let u_projectionMatrix = this.gl.getUniformLocation(this.shaderProgram, "u_projectionMatrix");

        // Kamera
        this.camera.setCamera();
        //modelMatrix.setIdentity();
        //modelMatrix.translate(0, 2, 0);
        let tmpModelMatrix = new Matrix4(modelMatrix);

        let modelviewMatrix = this.camera.getModelViewMatrix(modelMatrix);

        this.gl.uniformMatrix4fv(u_modelMatrix, false, tmpModelMatrix.elements);
        this.gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
        this.gl.uniformMatrix4fv(u_projectionMatrix, false, this.camera.projectionMatrix.elements);

        // Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
        let normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js
        this.gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.positionBuffer.numberOfItems);
    }
}


