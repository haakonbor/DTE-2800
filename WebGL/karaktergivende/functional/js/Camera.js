// Kameraposisjon:
let camPosX = 20;
let camPosY = 30;
let camPosZ = 50;

// Kamera ser mot ...
let lookAtX = 0;
let lookAtY = 0;
let lookAtZ = 0;

// Kameraorientering:
let upX = 0;
let upY = 1;
let upZ = 0;

function setupCamera() {
    // VIEW-matrisa:
    // cuon-utils: Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, lookAtX, lookAtY, lookAtZ, upX, upY, upZ)
    viewMatrix.setLookAt(camPosX, camPosY, camPosZ, lookAtX, lookAtY, lookAtZ, upX, upY, upZ);

    // PROJECTION-matrisa:
    // cuon-utils: Matrix4.prototype.setPerspective = function(fovy, aspect, near, far)
    projectionMatrix.setPerspective(45, canvas.width / canvas.height, 1, 10000);
}
