"use strict";
/*
  Tegner et hus
*/
class House {

    constructor(gl, camera, canvas) {
        this.gl = gl;
        this.camera = camera;
        this.canvas = canvas;

        this.stack = new Stack();
        // Fire kuber med ulike farger.
        this.baseCube = null;
        this.loftTriangle1 = null;
        this.loftTriangle2 = null;
        this.roofCubeLeft = null;
        this.roofCubeRight = null;

    }

    init(vertexShaderName, fragmentShaderName) {
        // Første etasje (grunnkube):
        this.baseCube = new Cube(this.gl, this.camera, this.canvas);
        this.baseCube.init(vertexShaderName, fragmentShaderName, "../textures/hustekstur.png", "houseBase");
        // Venstre takkube:
        this.roofCubeLeft = new Cube(this.gl, this.camera, this.canvas);
        this.roofCubeLeft.init(vertexShaderName, fragmentShaderName, "../textures/hustekstur.png", "houseRoof");
        // Høyre takkube:
        this.roofCubeRight = new Cube(this.gl, this.camera, this.canvas);
        this.roofCubeRight.init(vertexShaderName, fragmentShaderName, "../textures/hustekstur.png", "houseRoof");

        this.loftTriangle1 = new Triangle(this.gl, this.camera, this.canvas);
        this.loftTriangle1.init(vertexShaderName, fragmentShaderName, "../textures/hustekstur.png", "houseLoftFront");

        this.loftTriangle2 = new Triangle(this.gl, this.camera, this.canvas);
        this.loftTriangle2.init(vertexShaderName, fragmentShaderName, "../textures/hustekstur.png", "houseLoftBack");
    }

    handleKeys(elapsed, currentlyPressedKeys) {

    }

    draw(modelMatrix, light, elapsed) {

        this.stack.pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0, 0);
        modelMatrix.scale(1,1,1);
        this.stack.pushMatrix(modelMatrix);

        // Basen på huset
        modelMatrix.translate(0,10,0);
        modelMatrix.scale(10,10,15);
        this.stack.pushMatrix(modelMatrix);
        this.baseCube.draw(modelMatrix, light, elapsed);

        // Front loft
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,1,1);
        this.loftTriangle1.draw(modelMatrix, light, elapsed);

        // Bak loft
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,1,-1);
        modelMatrix.rotate(180, 0, 1, 0);
        this.loftTriangle2.draw(modelMatrix, light, elapsed);

        this.stack.popMatrix();

        // Venstre takdel
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(-5.5,25,0);
        modelMatrix.rotate(-45, 0, 0, 1);
        modelMatrix.scale(0.2,8,17);
        this.roofCubeLeft.draw(modelMatrix, light, elapsed);

        // Høyre takdel
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(5.5,25,0);
        modelMatrix.rotate(45, 0, 0, 1);
        modelMatrix.scale(0.2,8,17);
        this.roofCubeLeft.draw(modelMatrix, light, elapsed);

        //Tømmer stacken ...:
        this.stack.empty();
    }
}


