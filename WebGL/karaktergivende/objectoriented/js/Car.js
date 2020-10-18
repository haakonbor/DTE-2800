"use strict";
/*
* Kode basert på "Car.js" av Werner Farstad,
* hjulene er endret fra sirkler til syilndre, og kubene har fått både tekstur og interagerer med nå lys.
* */
class Car {

    constructor(gl, camera, canvas) {
        this.gl = gl;
        this.camera = camera;
        this.canvas = canvas;

        this.stack = new Stack();
        // Fire kuber med ulike farger.
        this.cube1 = null;
        this.cube2 = null;
        this.cube3 = null;
        this.cube4 = null;
        // Hjul:
        this.cylinder = null;

        this.steeringRot = 20;
        this.backboxRotation = 0;
        this.wheelRot = 0;
    }

    init(cubeVertexShaderName, cubeFragmentShaderName, cylinderVertexShaderName, cylinderFragmentShaderName) {
        //Akslinger:
        this.cube1 = new Cube(this.gl, this.camera, this.canvas);
        this.cube1.init(cubeVertexShaderName, cubeFragmentShaderName, "../textures/metall.png", "basicTexture");
        //Chassis/rota:
        this.cube2 = new Cube(this.gl, this.camera, this.canvas);
        this.cube2.init(cubeVertexShaderName, cubeFragmentShaderName, "../textures/tre.png", "basicTexture");
        //Styrhus:
        this.cube3 = new Cube(this.gl, this.camera, this.canvas);
        this.cube3.init(cubeVertexShaderName, cubeFragmentShaderName, "../textures/tre.png", "basicTexture");
        //Bolter:
        this.cube4 = new Cube(this.gl, this.camera, this.canvas);
        this.cube4.init(cubeVertexShaderName, cubeFragmentShaderName, "../textures/metall.png", "basicTexture");

        this.cylinder = new Cylinder(this.gl, this.camera, {red:0.1, blue: 0.1, green: 0.1, alpha:1.0});
        this.cylinder.init(cylinderVertexShaderName, cylinderFragmentShaderName);
    }

    handleKeys(elapsed, currentlyPressedKeys) {
        //Sving på hjulene
        if (currentlyPressedKeys[37] && this.steeringRot < 25) { // Venstre piltast
            this.steeringRot+=1;
        }
        if (currentlyPressedKeys[39] && this.steeringRot > -25) {	// Høyre piltast
            this.steeringRot-=1;
        }
    }

    draw(modelMatrix, light, elapsed) {
        this.stack.pushMatrix(modelMatrix);
        modelMatrix.translate(0, 3.7, 0);
        modelMatrix.scale(1,1,1);
        this.stack.pushMatrix(modelMatrix);

        // I*T*O*R*S  der O = R * T
        // Rota/platformen.
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,0,0);
        modelMatrix.scale(15,0.8,6);
        this.cube2.draw(modelMatrix, light, elapsed);
        // Styrhus:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(2.5, 2, -2);
        modelMatrix.scale(2,2,2);
        this.cube3.draw(modelMatrix, light, elapsed);

        // *** Aksling og hjul FORAN - med STYRING:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(-10.5, -1.2, 0);
        modelMatrix.rotate(this.steeringRot, 0, 1, 0);
        this.stack.pushMatrix(modelMatrix);
        //- Aksling:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 0);
        modelMatrix.scale(0.4,0.4,8);
        this.cube1.draw(modelMatrix, light, elapsed);
        //- Akselbolt:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 1, 0);
        modelMatrix.scale(0.4,1.6,0.4);
        this.cube4.draw(modelMatrix, light, elapsed);
        //- Venstre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 8);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.cylinder.draw(elapsed, modelMatrix);
        //- Høyre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, -8);
        modelMatrix.rotate(-90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.cylinder.draw(elapsed, modelMatrix);

        this.stack.popMatrix();    // Ta utgangspunkt i "rota" igjen.

        // *** Aksling og hjul BAK:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(10.5, -1.2, 0);
        this.stack.pushMatrix(modelMatrix);
        //- Aksling:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 0);
        modelMatrix.scale(0.4,0.4,8);
        this.cube1.draw(modelMatrix, light, elapsed);
        //- Akselbolt-1:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 1, 3.5);
        modelMatrix.scale(0.4,1.6,0.4);
        this.cube4.draw(modelMatrix, light, elapsed);
        //- Akselbolt-2:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 1, -3.5);
        modelMatrix.scale(0.4,1.6,0.4);
        this.cube4.draw(modelMatrix, light, elapsed);
        //- Venstre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 8);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.cylinder.draw(elapsed, modelMatrix);
        //- Høyre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, -8);
        modelMatrix.rotate(-90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.cylinder.draw(elapsed, modelMatrix);

        this.stack.popMatrix();    // Ta utgangspunkt i "rota" igjen.

        //- Boks:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(15, 0.1, 0);
        modelMatrix.rotate(this.backboxRotation, 0, 1, 0);
        this.stack.pushMatrix(modelMatrix);
        this.cube4.draw(modelMatrix, light, elapsed);

        //Tømmer stacken ...:
        this.stack.empty();
    }
}


