// Verteksbuffer:
let cubePositionBuffer = null;
let cubeNormalBuffer = null;
let cubeTextureBuffer = null;
let cubeTexture = null;

let cubePositions = new Float32Array([
    //Forsiden (pos):
    -1, 1, 1,
    -1, -1, 1,
    1, -1, 1,

    -1, 1, 1,
    1, -1, 1,
    1, 1, 1,

    //H�yre side:
    1, 1, 1,
    1, -1, 1,
    1, -1, -1,

    1, 1, 1,
    1, -1, -1,
    1, 1, -1,

    //Baksiden:
    1, -1, -1,
    -1, -1, -1,
    1, 1, -1,

    -1, -1, -1,
    -1, 1, -1,
    1, 1, -1,

    //Venstre side:
    -1, -1, -1,
    -1, 1, 1,
    -1, 1, -1,

    -1, -1, 1,
    -1, 1, 1,
    -1, -1, -1,

    //Topp:
    -1, 1, 1,
    1, 1, 1,
    -1, 1, -1,

    -1, 1, -1,
    1, 1, 1,
    1, 1, -1,

    //Bunn:
    -1, -1, -1,
    1, -1, 1,
    -1, -1, 1,

    -1, -1, -1,
    1, -1, -1,
    1, -1, 1
]);

// Teksturkoordinater / UV-koordinater:
let cubeUVs = new Float32Array([
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

// NORMALVEKTORER:
let cubeNormals = new Float32Array([
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


function initCubeBuffers(textureImage) {
    cubePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);
    cubePositionBuffer.itemSize = 3;
    cubePositionBuffer.numberOfItems = 36;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //TEKSTUR-RELATERT:
    cubeTexture = gl.createTexture();
    //Teksturbildet er nå lastet fra server, send til GPU:
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);

    //Unngaa at bildet kommer opp-ned:
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);   //NB! FOR GJENNOMSIKTIG BAKGRUNN!! Sett også gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    //Laster teksturbildet til GPU/shader:
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);

    //Teksturparametre:
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, null);

    cubeTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeUVs, gl.STATIC_DRAW);
    cubeTextureBuffer.itemSize = 2;
    cubeTextureBuffer.numberOfItems = 36;



    cubeNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeNormals, gl.STATIC_DRAW);
    cubeNormalBuffer.itemSize = 3;
    cubeNormalBuffer.numberOfItems = 36;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawCube() {

    // NB! PASS PÅ DENNE DERSOM FLERE SHADERPAR ER I BRUK!
    // Binder shaderparametre:
    if (!bindShaderParameters(gl.cubeShaderProgram))
        return;
    gl.useProgram(gl.cubeShaderProgram);

    // Posisjon:
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    let a_Position = gl.getAttribLocation(gl.cubeShaderProgram, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //Teksturspesifikt:
    //Bind til teksturkoordinatparameter i shader:
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuffer);
    let a_TextureCoord = gl.getAttribLocation(gl.cubeShaderProgram, "a_TextureCoord");
    gl.vertexAttribPointer(a_TextureCoord, cubeTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TextureCoord);
    //Aktiver teksturenhet (0):
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    //Send inn verdi som indikerer hvilken teksturenhet som skal brukes (her 0):
    let samplerLoc = gl.getUniformLocation(gl.cubeShaderProgram, "uSampler");
    gl.uniform1i(samplerLoc, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Normalvektor:
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
    let a_Normal = gl.getAttribLocation(gl.cubeShaderProgram, 'a_Normal');
    if (a_Normal !== -1) {  //-1 dersom a_Normal ikke er i bruk i shaderen.
        gl.vertexAttribPointer(a_Normal, cubeNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //Lysvariabler:
    let u_LightPos = gl.getUniformLocation(gl.cubeShaderProgram, 'u_lightPosition');
    let u_AmbientLightColor = gl.getUniformLocation(gl.cubeShaderProgram, 'u_ambientLightColor');
    let u_DiffuseLightColor = gl.getUniformLocation(gl.cubeShaderProgram, 'u_diffuseLightColor');

    //Gi verdi til lysvariablene:
    let lightPosition = [pointLightPos.x, pointLightPos.y, pointLightPos.z];
    let ambientLightColor = [generalLightColor.r, generalLightColor.g, generalLightColor.b];
    let diffuseLightColor = [pointLightColor.r, pointLightColor.g, pointLightColor.b];

    //Gi verdi til lysvariablene:
    gl.uniform3fv(u_LightPos, lightPosition);
    gl.uniform3fv(u_AmbientLightColor, ambientLightColor);
    gl.uniform3fv(u_DiffuseLightColor, diffuseLightColor);

    // Matriser:
    let u_normalMatrix = gl.getUniformLocation(gl.cubeShaderProgram, 'u_normalMatrix');
    let u_modelMatrix = gl.getUniformLocation(gl.cubeShaderProgram, 'u_modelMatrix');	//NB!!!!
    let u_modelviewMatrix = gl.getUniformLocation(gl.cubeShaderProgram, 'u_modelviewMatrix');
    let u_projectionMatrix = gl.getUniformLocation(gl.cubeShaderProgram, 'u_projectionMatrix');

    //Still inn kamera:
    setupCamera();
    //modelMatrix.setIdentity();
    //Roter  om egen y-akse:
    //modelMatrix.rotate(yRot, 0, 1, 0);
    let tmpModelMatrix = new Matrix4(modelMatrix);

    // Slår sammen modell & view til modelview-matrise:
    modelviewMatrix = viewMatrix.multiply(modelMatrix);

    // Sender matriser til shader:
    gl.uniformMatrix4fv(u_modelMatrix, false, tmpModelMatrix.elements);
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

    //Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
    let normalMatrix = mat3.create();
    mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js
    gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);

    // Tegner:
    gl.drawArrays(gl.TRIANGLES, 0, cubePositionBuffer.numberOfItems);
}
