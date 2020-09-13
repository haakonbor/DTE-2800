"use strict";
/*
    Tegner koordinatsystemet.
*/
class Scooter {

    constructor(gl, camera) {
        this.gl = gl;
        this.camera = camera;

        this.stack = new Stack();
        // Fire kuber med ulike farger.
        this.cube1 = null;
        this.cube2 = null;
        this.cube3 = null;
        this.cube4 = null;
        this.cubeColor = {red:0, green:0, blue:1, alpha:1};
        // Hjul:
        this.circle1 = null;
        this.circle2 = null;
        this.circle3 = null;
        this.circle4 = null;
        this.circleColor = {red:0, green:1, blue:1, alpha:1};

        this.cylinder1 = null;
        this.cylinder2 = null;
        this.cylinder3 = null;
        this.cylinder4 = null;
        this.cylinder5 = null;
        this.cylinder6 = null;
        this.cylinder7 = null;
        this.wheelColor = {red:0.3, green:0.3, blue:0.3, alpha:1};
        this.stickColor = {red:0, green:0, blue:1, alpha:1};
        this.handleColor = {red:0.1, green:0.1, blue:0.1, alpha:1};

        this.steeringRot = -45;
        //this.backboxRotation = 0;
        this.wheelRot = 0;
    }

    initBuffers() {
        //Grunn-kuben:
        this.cube1 = new Cube(this.gl, this.camera, this.cubeColor);
        this.cube1.initBuffers();
        //Bakhjulskjerm del1:
        this.cube2 = new Cube(this.gl, this.camera, this.cubeColor);
        this.cube2.initBuffers();
        //Bakhjulskjerm del2:
        this.cube3 = new Cube(this.gl, this.camera, this.cubeColor);
        this.cube3.initBuffers();
        //Forhjulskjerm:
        this.cube4 = new Cube(this.gl, this.camera, this.cubeColor);
        this.cube4.initBuffers();

        //Bakhjul
        this.circle1 = new Circle(this.gl, this.camera, this.circleColor);
        this.circle1.initBuffers();

        this.circle2 = new Circle(this.gl, this.camera, this.circleColor);
        this.circle2.initBuffers();

        //Forhjul
        this.circle3 = new Circle(this.gl, this.camera, this.circleColor);
        this.circle3.initBuffers();

        this.circle4 = new Circle(this.gl, this.camera, this.circleColor);
        this.circle4.initBuffers();

        //Bakhjul
        this.cylinder1 = new Cylinder(this.gl, this.camera, this.wheelColor);
        this.cylinder1.initBuffers();

        //Forhjul
        this.cylinder2 = new Cylinder(this.gl, this.camera, this.wheelColor);
        this.cylinder2.initBuffers();

        //Stang ved hjulet
        this.cylinder3 = new Cylinder(this.gl, this.camera, this.stickColor);
        this.cylinder3.initBuffers();

        //Stangforlengelse
        this.cylinder4 = new Cylinder(this.gl, this.camera, this.stickColor);
        this.cylinder4.initBuffers();

        //Styrestang
        this.cylinder5 = new Cylinder(this.gl, this.camera, this.stickColor);
        this.cylinder5.initBuffers();

        //Venstre håndtak
        this.cylinder6 = new Cylinder(this.gl, this.camera, this.handleColor);
        this.cylinder6.initBuffers();

        //Høyre håndtak
        this.cylinder7 = new Cylinder(this.gl, this.camera, this.handleColor);
        this.cylinder7.initBuffers();

    }

    handleKeys(elapsed, currentlyPressedKeys) {
        //Sving på forhjulet
        if (currentlyPressedKeys[89] && this.steeringRot < 45) { //Y
            this.steeringRot+=1;
        }
        if (currentlyPressedKeys[85] && this.steeringRot > -45) {	//U
            this.steeringRot-=1;
        }
        //Snurre på hjulene
        if (currentlyPressedKeys[70]) {	//F
            if(this.wheelRot >= 360)
                this.wheelRot = 1;
            else
                this.wheelRot+=1;
        }
        if (currentlyPressedKeys[71]) {	//G
            if(this.wheelRot <= -360)
                this.wheelRot = -1;
            else
                this.wheelRot-=1;
        }
    }

    draw(elapsed, modelMatrix) {
        // Viser styrevinkel:
        document.getElementById("angle").innerHTML = this.steeringRot;

        this.stack.pushMatrix(modelMatrix);
        modelMatrix.translate(0, 1, 0);
        modelMatrix.scale(1,1,1);
        this.stack.pushMatrix(modelMatrix);

        // I*T*O*R*S  der O = R * T
        // Grunn-kuben:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,0,0);
        modelMatrix.scale(15,0.5,6);
        this.cube2.draw(elapsed, modelMatrix);

        // Bakhjulskjerm del1:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(8, 3, 0);
        modelMatrix.rotate(45,0,0,1);
        this.stack.pushMatrix(modelMatrix);
        modelMatrix.scale(4,0.5,5);
        this.cube3.draw(elapsed, modelMatrix);

        // Bakhjulskjerm del2:
        modelMatrix = this.stack.popMatrix();
        modelMatrix.translate(0, 0, -0);
        modelMatrix.rotate(-45,0,0,1);
        modelMatrix.translate(6.5, 2.5, 0);
        modelMatrix.scale(4,0.5,5);
        this.cube4.draw(elapsed, modelMatrix);

        // Bakhjul:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(15,0,4);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);
        modelMatrix.scale(2.5,1,2.5);
        this.circle1.draw(elapsed, modelMatrix);

        modelMatrix = this.stack.peekMatrix()
        modelMatrix.translate(15,0,-4);
        modelMatrix.rotate(90, 1, 0, 0);
        modelMatrix.rotate(this.wheelRot, 0, 1, 0);
        this.stack.pushMatrix(modelMatrix);
        modelMatrix.scale(2.5,1,2.5);
        this.circle2.draw(elapsed, modelMatrix);

        //Dekk på bakhjul
        modelMatrix = this.stack.popMatrix();
        modelMatrix.translate(0,0.1,0);
        modelMatrix.scale(4.5,2.5,4.5);
        this.cylinder1.draw(elapsed, modelMatrix);

        // Forhjulskjerm:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(-20, 4.7, 0);
        modelMatrix.rotate(-45,0,0,1);
        modelMatrix.scale(7,0.5,5);
        this.cube4.draw(elapsed, modelMatrix);

        // Forhjul (dekk og felger)
        modelMatrix = this.stack.peekMatrix();

        // Må utføre denne ekstra translasjonen fordi pivot-punktet for sylinderen ligger ved
        // enden av sylinderen (hvor den ene sirkelen den bygger på ligger)
        let xRotationOffset = Math.sin(this.steeringRot*Math.PI/180)*4.5;
        let zRotationOffset = ((this.steeringRot > 0) ?
            Math.sin(this.steeringRot*Math.PI/180)*2.5 : -Math.sin(this.steeringRot*Math.PI/180)*2.5);

        modelMatrix.translate(-27.5 + xRotationOffset, 0,-4 + zRotationOffset);
        modelMatrix.rotate(90,1,0,0);
        modelMatrix.rotate(this.steeringRot,0,0,1);
        modelMatrix.rotate(this.wheelRot,0,1,0)
        this.stack.pushMatrix(modelMatrix);
        modelMatrix.scale(4.5,2.5,4.5);
        this.cylinder2.draw(elapsed, modelMatrix);

        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,7.6,0);
        modelMatrix.scale(2.5,2.5,2.5);
        this.circle3.draw(elapsed, modelMatrix);

        modelMatrix = this.stack.popMatrix();
        modelMatrix.translate(0,-0.1,0);
        modelMatrix.scale(2.5,2.5,2.5);
        this.circle4.draw(elapsed, modelMatrix);

        // Stang ved hjulet
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(-28,1,0);
        modelMatrix.rotate(-20, 0,0,1)
        this.stack.pushMatrix(modelMatrix);
        modelMatrix.scale(1.2,5,1.2);
        this.cylinder3.draw(elapsed, modelMatrix);

        // Stangforlengelse
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,15,0);
        modelMatrix.rotate(-this.steeringRot,0,1,0);
        this.stack.pushMatrix(modelMatrix);
        modelMatrix.scale(0.6,6,0.6);
        this.cylinder4.draw(elapsed, modelMatrix);

        // Styrestang
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,18,-6);
        modelMatrix.rotate(90,1,0,0);
        this.stack.pushMatrix(modelMatrix);
        modelMatrix.scale(0.6,4,0.6);
        this.cylinder5.draw(elapsed, modelMatrix);

        // Håndtak
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,9.7,0);
        modelMatrix.scale(0.8,0.8,0.8);
        this.cylinder6.draw(elapsed, modelMatrix);

        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,-0.1,0);
        modelMatrix.scale(0.8,0.8,0.8);
        this.cylinder7.draw(elapsed, modelMatrix);










        /*
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
        */

        //Tømmer stacken ...:
        this.stack.empty();
    }
}


