"use strict";

let N_CARS = 7
let N_HOUSES = 5

// Debug funksjoner hentet fra: https://www.khronos.org/webgl/wiki/Debugging
function throwOnGLError(err, funcName, args) {
    throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
}

function logGLCall(functionName, args) {
    console.log("gl." + functionName + "(" +
        WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
}

function validateNoneOfTheArgsAreUndefined(functionName, args) {
    for (let ii = 0; ii < args.length; ++ii) {
        if (args[ii] === undefined) {
            console.error("undefined passed to gl." + functionName + "(" +
                WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
        }
    }
}

function logAndValidate(functionName, args) {
    //logGLCall(functionName, args);
    validateNoneOfTheArgsAreUndefined (functionName, args);
}

class MainApp {
    constructor() {
        this.gl = null;
        this.canvas = null;

        this.stack = new Stack();

        this.currentlyPressedKeys = [];

        this.lastTime = 0.0;

        this.cars = [];
        this.houses = [];
    }

    start() {
        this.initContext();

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);


        // Bakgrunnsfarge
        this.gl.clearColor(0.4, 0.4, 0.4, 1.0);

        // Kamera
        this.camera = new Camera(this.canvas );
        this.camera.setCamera();

        // Plan
        this.plane = new XZPlane(this.gl, this.camera, this.canvas);
        this.plane.init(
            "xzplane-phong-vertex-shader",
            "xzplane-phong-fragment-shader",
            "../textures/nabolag.png");

        // Lys
        this.light = new LightSource(this.gl, this.camera, this.canvas);
        this.light.init(
            "light-source-vertex-shader",
            "light-source-fragment-shader");



        // Bilene
        for (let i = 0; i < N_CARS - 1; i++) {
            this.cars[i] = new Car(this.gl, this.camera, this.canvas);
            this.cars[i].init(
                "cube-vertex-shader",
                "cube-fragment-shader",
                "simple-vertex-shader",
                "simple-fragment-shader"
            )
        }

        // Husene
        for (let i = 0; i < N_HOUSES - 1; i++) {
            this.houses[i] = new House(this.gl, this.camera, this.canvas);
            this.houses[i].init(
                "cube-vertex-shader",
                "cube-fragment-shader"
            )
        }

        this.draw();
    }

    initContext() {
        // Henter canvas elementet og WebGL kontekst
        this.canvas = document.getElementById("webgl");

        this.gl = getWebGLContext(this.canvas);
        this.gl = WebGLDebugUtils.makeDebugContext(this.gl, throwOnGLError, logAndValidate);

        if (!this.gl) {
            console.log("Fikk ikke tak i rendering context for WebGL");
            return false;
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        document.addEventListener('keyup', this.handleKeyUp.bind(this), false);
        document.addEventListener('keydown', this.handleKeyDown.bind(this), false);

        // this.debugContext = WebGLDebugUtils.makeDebugContext(this.canvas.getContext("webgl"))
    }

    handleKeyUp(event) {
        this.currentlyPressedKeys[event.which] = false;
    }

    handleKeyDown(event) {
        this.currentlyPressedKeys[event.which] = true;
    }

    handleKeys(elapsed) {
        this.camera.handleKeys(elapsed, this.currentlyPressedKeys);

        this.light.handleKeys(elapsed, this.currentlyPressedKeys)

        for (let i = 0; i < N_CARS - 1; i++)
            if (this.currentlyPressedKeys[49 + i])  // 49 er tallet 1, 50 er tallet 2, osv...
                this.cars[i].handleKeys(elapsed, this.currentlyPressedKeys);
    }

    draw(currentTime) {
        requestAnimationFrame(this.draw.bind(this));

        if (currentTime === undefined)
            currentTime = 0;

        // For varierende framerate
        let elapsed = 0.0;
        if (this.lastTime !== 0.0)
            elapsed = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Gjennomsiktighet
        /*
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        */

        // Dybdetest
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);

        //NB! Backface Culling:
        this.gl.frontFace(this.gl.CCW);		//indikerer at trekanter med vertekser angitt i CCW er front-facing!
        this.gl.enable(this.gl.CULL_FACE);	//enabler culling.
        this.gl.cullFace(this.gl.BACK);		//culler baksider.


        // TEGNER:
        let modelMatrix = new Matrix4();
        modelMatrix.setIdentity();
        this.stack.pushMatrix(modelMatrix);

        // Tegner planet
        this.plane.draw(modelMatrix, this.light);

        // Tegner bil 1
        modelMatrix.rotate(90, 0,1,0);
        this.cars[0].draw(modelMatrix, this.light, elapsed);

        // Tegner bil 2
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(200, 0, -300);
        this.cars[1].draw(modelMatrix, this.light, elapsed);

        // Tegner hus 1
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(-400, 0, 230);
        modelMatrix.rotate(180, 0,1,0);
        modelMatrix.scale(2,2,2);
        this.houses[0].draw(modelMatrix, this.light, elapsed);

        // Tegner hus 2
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(-200, 0, 240);
        modelMatrix.rotate(180, 0,1,0);
        modelMatrix.scale(3,2,3);
        this.houses[1].draw(modelMatrix, this.light, elapsed);

        // Tegner hus 3
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(200, 0, -80);
        modelMatrix.rotate(180, 0,1,0);
        modelMatrix.scale(2.5,2.5,2.5);
        this.houses[2].draw(modelMatrix, this.light, elapsed);

        // Tegner hus 4
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(400, 0, -80);
        modelMatrix.rotate(180, 0,1,0);
        modelMatrix.scale(1.8,1.8,2.5);
        this.houses[2].draw(modelMatrix, this.light, elapsed);

        // Tegner hus 5
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(280, 0, -310);
        modelMatrix.rotate(-90, 0,1,0);
        modelMatrix.scale(3.5,3,3);
        this.houses[2].draw(modelMatrix, this.light, elapsed);

        // Tegner hus 5
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(280, 0, -310);
        modelMatrix.rotate(-90, 0,1,0);
        modelMatrix.scale(3.5,3,3);
        this.houses[2].draw(modelMatrix, this.light, elapsed);

        // Tegner lyset
        this.light.draw(modelMatrix);

        // Behandler brukerinput
        this.handleKeys(elapsed);
    }
}
