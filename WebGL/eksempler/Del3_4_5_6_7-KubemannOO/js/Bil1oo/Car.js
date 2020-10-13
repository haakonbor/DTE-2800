"use strict";
/*
    Tegner koordinatsystemet.
*/
class Car {

    constructor(gl, camera) {
        this.gl = gl;
        this.camera = camera;

        this.stack = new Stack();
        // Fire kuber med ulike farger.
        this.cube1 = null;
        this.cube2 = null;
        this.cube3 = null;
        this.cube4 = null;
        // Hjul:
        this.circle = null;

        this.steeringRot = 20;
        this.backboxRotation = 0;
        this.wheelRot = 0;
    }

    initBuffers() {
        //Akslinger:
        this.cube1 = new Cube(this.gl, this.camera, {red:0.5, green:0.9, blue:0, alpha:1});
        this.cube1.initBuffers();
        //Chassis/rota:
        this.cube2 = new Cube(this.gl, this.camera, {red:0.9, green:0.3, blue:0, alpha:1});
        this.cube2.initBuffers();
        //Styrhus:
        this.cube3 = new Cube(this.gl, this.camera, {red:0.0, green:0.7, blue:0.9, alpha:1});
        this.cube3.initBuffers();
        //Bolter:
        this.cube4 = new Cube(this.gl, this.camera, {red:0.3, green:0.3, blue:0.3, alpha:1});
        this.cube4.initBuffers();

        this.circle = new Circle(this.gl, this.camera, {red:0.5, green:0.5, blue:0.5, alpha:1});
        this.circle.initBuffers();
    }

    handleKeys(elapsed, currentlyPressedKeys) {
        //Sving på hjulene
        if (currentlyPressedKeys[89]) { //Y
            this.steeringRot+=1;
        }
        if (currentlyPressedKeys[85]) {	//U
            this.steeringRot-=1;
        }
    }

    draw(elapsed, modelMatrix) {
        // Viser styrevinkel:
        document.getElementById("angle").innerHTML = this.steeringRot;

        this.stack.pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0, 0);
        modelMatrix.scale(1,1,1);
        this.stack.pushMatrix(modelMatrix);

        // I*T*O*R*S  der O = R * T
        // Rota/platformen.
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,0,0);
        modelMatrix.scale(15,0.8,6);
        this.cube2.draw(elapsed, modelMatrix);
        // Styrhus:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(2.5, 2, -2);
        modelMatrix.scale(2,2,2);
        this.cube3.draw(elapsed, modelMatrix);

        // *** Aksling og hjul FORAN - med STYRING:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(-10.5, -1.2, 0);
        modelMatrix.rotate(this.steeringRot, 0, 1, 0);
        this.stack.pushMatrix(modelMatrix);
        //- Aksling:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 0);
        modelMatrix.scale(0.4,0.4,8);
        this.cube1.draw(elapsed, modelMatrix);
        //- Akselbolt:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 1, 0);
        modelMatrix.scale(0.4,1.6,0.4);
        this.cube4.draw(elapsed, modelMatrix);
        //- Venstre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 8);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.circle.draw(elapsed, modelMatrix);
        //- Høyre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, -8);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.circle.draw(elapsed, modelMatrix);

        this.stack.popMatrix();    // Ta utgangspunkt i "rota" igjen.

        // *** Aksling og hjul BAK:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(10.5, -1.2, 0);
        this.stack.pushMatrix(modelMatrix);
        //- Aksling:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 0);
        modelMatrix.scale(0.4,0.4,8);
        this.cube1.draw(elapsed, modelMatrix);
        //- Akselbolt-1:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 1, 3.5);
        modelMatrix.scale(0.4,1.6,0.4);
        this.cube4.draw(elapsed, modelMatrix);
        //- Akselbolt-2:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 1, -3.5);
        modelMatrix.scale(0.4,1.6,0.4);
        this.cube4.draw(elapsed, modelMatrix);
        //- Venstre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, 8);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.circle.draw(elapsed, modelMatrix);
        //- Høyre hjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0, 0, -8);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);    //egen akse!!
        modelMatrix.scale(2.5,1,2.5);
        this.circle.draw(elapsed, modelMatrix);

        this.stack.popMatrix();    // Ta utgangspunkt i "rota" igjen.

        //- Boks:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(15, 0.1, 0);
        modelMatrix.rotate(this.backboxRotation, 0, 1, 0);
        this.stack.pushMatrix(modelMatrix);
        this.cube4.draw(elapsed, modelMatrix);

        //Tømmer stacken ...:
        this.stack.empty();
    }
}


