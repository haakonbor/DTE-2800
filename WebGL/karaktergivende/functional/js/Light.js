let lightSourcePositionBuffer = null;
let pointLightPos = {x: -10, y:20, z:0.0};
let generalLightColor = {r: 0.1, g: 0.1, b: 0.1};
let pointLightColor = {r: 1.0, g: 1.0, b: 1.0};

function initLightSourceBuffer() {
    lightSourcePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lightSourcePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);
    lightSourcePositionBuffer.itemSize = 3;
    lightSourcePositionBuffer.numberOfItems = 36;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawLightSource() {
    // Bind og velg rett shader:
    if (!bindShaderParameters(gl.lightSourceShaderProgram))
        return;
    gl.useProgram(gl.lightSourceShaderProgram);

    // Posisjon:
    gl.bindBuffer(gl.ARRAY_BUFFER, lightSourcePositionBuffer);
    let a_Position = gl.getAttribLocation(gl.lightSourceShaderProgram, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //Kopler til fragmentshader-fargeattributt:
    let u_FragColor = gl.getUniformLocation(gl.lightSourceShaderProgram, 'u_FragColor');
    let rgba = [254.0/256, 250.0/256, 37.0/256, 1.0];  // gult!
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Kamera & matriser:
    setupCamera();
    modelMatrix.setIdentity();
    modelMatrix.translate(pointLightPos.x, pointLightPos.y, pointLightPos.z);
    modelMatrix.scale(1.0, 1.0, 1.0);
    let u_modelviewMatrix = gl.getUniformLocation(gl.lightSourceShaderProgram, 'u_modelviewMatrix');
    let u_projectionMatrix = gl.getUniformLocation(gl.lightSourceShaderProgram, 'u_projectionMatrix');
    modelviewMatrix = viewMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
    gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

    // Tegner:
    gl.drawArrays(gl.TRIANGLES, 0, lightSourcePositionBuffer.numberOfItems);
}