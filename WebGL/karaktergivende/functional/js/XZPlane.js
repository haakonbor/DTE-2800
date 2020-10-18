// Verteksbuffer:
let xzplanePositionBuffer = null;
let xzplaneNormalBuffer = null;
let xzplaneTextureBuffer = null;
let xzplaneTexture = null;

let XZPlaneTextureIsLoaded = false;

let xzplanePositions = new Float32Array([
    -COORD_BOUNDARY/2, 0, COORD_BOUNDARY/2,
    COORD_BOUNDARY/2, 0, COORD_BOUNDARY/2,
    -COORD_BOUNDARY/2, 0, -COORD_BOUNDARY/2,

    -COORD_BOUNDARY/2, 0, -COORD_BOUNDARY/2,
    COORD_BOUNDARY/2, 0, COORD_BOUNDARY/2,
    COORD_BOUNDARY/2, 0, -COORD_BOUNDARY/2,
]);

let xzplaneUVs = new Float32Array ([
    0, 0,
    1, 0,
    0, 1,

    0, 1,
    1, 0,
    1, 1
]);

// NORMALVEKTORER:
let xzplaneNormals = new Float32Array([
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
]);

function initXZPlaneBuffer(textureImage) {
    // Posisjonsbuffer
    xzplanePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, xzplanePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, xzplanePositions, gl.STATIC_DRAW);
    xzplanePositionBuffer.itemSize = 3;
    xzplanePositionBuffer.numberOfItems = 6;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //TEKSTUR-RELATERT:
    xzplaneTexture = gl.createTexture();
    //Teksturbildet er nå lastet fra server, send til GPU:
    gl.bindTexture(gl.TEXTURE_2D, xzplaneTexture);

    //Unngaa at bildet kommer opp-ned:
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);   //NB! FOR GJENNOMSIKTIG BAKGRUNN!! Sett også gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    //Laster teksturbildet til GPU/shader:
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);

    //Teksturparametre:
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, null);

    // Teksturbuffer
    xzplaneTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, xzplaneTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, xzplaneUVs, gl.STATIC_DRAW);
    xzplaneTextureBuffer.itemSize = 2;
    xzplaneTextureBuffer.numberOfItems = 6;

    // Normalvektorbuffer
    xzplaneNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, xzplaneNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, xzplaneNormals, gl.STATIC_DRAW);
    xzplaneNormalBuffer.itemSize = 3;
    xzplaneNormalBuffer.numberOfItems = 6;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawXZPlane() {

    if (!XZPlaneTextureIsLoaded)
        return

    // NB! PASS PÅ DENNE DERSOM FLERE SHADERPAR ER I BRUK!
    // Binder shaderparametre:
    if (!bindShaderParameters(gl.xzplaneShaderProgram))
        return;
    gl.useProgram(gl.xzplaneShaderProgram);

    // Posisjon:
    gl.bindBuffer(gl.ARRAY_BUFFER, xzplanePositionBuffer);
    let a_Position = gl.getAttribLocation(gl.xzplaneShaderProgram, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Tekstur:
    //Bind til teksturkoordinatparameter i shader:
    gl.bindBuffer(gl.ARRAY_BUFFER, xzplaneTextureBuffer);
    let a_TextureCoord = gl.getAttribLocation(gl.xzplaneShaderProgram, "a_TextureCoord");
    gl.vertexAttribPointer(a_TextureCoord, xzplaneTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TextureCoord);
    //Aktiver teksturenhet (0):
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, xzplaneTexture);
    //Send inn verdi som indikerer hvilken teksturenhet som skal brukes (her 0):
    let samplerLoc = gl.getUniformLocation(gl.xzplaneShaderProgram, "uSampler");
    gl.uniform1i(samplerLoc, 0);  // Sender inn verdien 0.
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Normalvektor:
    gl.bindBuffer(gl.ARRAY_BUFFER, xzplaneNormalBuffer);
    let a_Normal = gl.getAttribLocation(gl.xzplaneShaderProgram, 'a_Normal');
    if (a_Normal !== -1) {  //-1 dersom a_Normal ikke er i bruk i shaderen.
        gl.vertexAttribPointer(a_Normal, xzplaneNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //Lysvariabler:
    let u_LightPos = gl.getUniformLocation(gl.xzplaneShaderProgram, 'u_lightPosition');
    let u_DiffuseLightColor = gl.getUniformLocation(gl.xzplaneShaderProgram, 'u_diffuseLightColor');
    let u_AmbientLightColor = gl.getUniformLocation(gl.xzplaneShaderProgram, 'u_ambientLightColor');

    //Gi verdi til lysvariablene:
    let lightPosition = [pointLightPos.x, pointLightPos.y, pointLightPos.z];
    let diffuseLightColor = [pointLightColor.r, pointLightColor.g, pointLightColor.b];
    let ambientLightColor = [generalLightColor.r, generalLightColor.g, generalLightColor.b];

    //Gi verdi til lysvariablene:
    gl.uniform3fv(u_LightPos, lightPosition);
    gl.uniform3fv(u_DiffuseLightColor, diffuseLightColor);
    gl.uniform3fv(u_AmbientLightColor, ambientLightColor);

    // Matriser:
    let u_normalMatrix = gl.getUniformLocation(gl.xzplaneShaderProgram, 'u_normalMatrix');
    let u_modelMatrix = gl.getUniformLocation(gl.xzplaneShaderProgram, 'u_modelMatrix');	//NB!!!!
    let u_modelviewMatrix = gl.getUniformLocation(gl.xzplaneShaderProgram, 'u_modelviewMatrix');
    let u_projectionMatrix = gl.getUniformLocation(gl.xzplaneShaderProgram, 'u_projectionMatrix');

    //Still inn kamera:
    setupCamera();
    modelMatrix.setIdentity();
    //Roter  om egen y-akse:
    modelMatrix.translate(0, -0.01, 0);
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
    gl.drawArrays(gl.TRIANGLES, 0, xzplanePositionBuffer.numberOfItems);
}