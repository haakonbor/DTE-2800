"use strict";
/*
    Tegner koordinatsystemet.
*/
class Cylinder {

    constructor(gl, camera, color) {
        this.gl = gl;
        this.camera = camera;

        this.stack = new Stack();
        this.circle1 = null;
        this.circle2 = null;

        this.cylinderFloat32Vertices = null;
        this.vertexBufferCylinder = null;
        this.noVertsCylinder = 0;
        this.color = color;

    }

    initCylinderVertices() {
        let cylinderVertices = [];

        //console.log("NOVERTSCIRCLE:", this.circle2.noVertsCircle);

        for (let i = 1; i <= this.circle2.noVertsCircle - 1; i++) {
            cylinderVertices = cylinderVertices.concat(this.circle1.circleFloat32Vertices[7*i],
                this.circle1.circleFloat32Vertices[(7*i)+1],
                this.circle1.circleFloat32Vertices[7*i+2],
                this.color.red, this.color.green, this.color.blue, this.color.alpha);

            cylinderVertices = cylinderVertices.concat(this.circle2.circleFloat32Vertices[7*i],
                this.circle2.circleFloat32Vertices[(7*i)+1],
                this.circle2.circleFloat32Vertices[7*i+2],
                this.color.red, this.color.green, this.color.blue, this.color.alpha);
        }
        //console.log(cylinderVertices);

        this.noVertsCylinder = (this.circle2.noVertsCircle-1) * 2;
        this.cylinderFloat32Vertices = new Float32Array(cylinderVertices);
        console.log(this.cylinderFloat32Vertices);
    }

    initBuffers() {
        this.circle1 = new Circle(this.gl, this.camera, this.color);
        this.circle1.initBuffers();
        //console.log(this.circle1.circleFloat32Vertices)

        this.circle2 = new Circle(this.gl, this.camera, this.color, 3);
        this.circle2.initBuffers();

        this.initCylinderVertices();
        this.vertexBufferCylinder = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferCylinder);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cylinderFloat32Vertices, this.gl.STATIC_DRAW);

        this.vertexBufferCylinder.itemSize = 3 + 4;
        this.vertexBufferCylinder.numberOfItems = this.noVertsCylinder; //= antall vertekser
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    }

    handleKeys(elapsed, currentlyPressedKeys) {
        // for styring av armer osv.
    }

    draw(elapsed, modelMatrix) {
        //modelMatrix.setIdentity();
        this.stack.pushMatrix(modelMatrix);	 	//Legges på toppen av stacken.

        this.circle1.draw(elapsed, modelMatrix);

        modelMatrix = this.stack.peekMatrix()
        //modelMatrix.translate(0,3,0);
        this.circle2.draw(elapsed,modelMatrix);
        //console.log(this.circle2.circleFloat32Vertices)

        this.camera.setCamera();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferCylinder);
        let a_Position = this.gl.getAttribLocation(this.gl.program, 'a_Position');
        let stride = (3 + 4) * 4;
        this.gl.vertexAttribPointer(a_Position, 3, this.gl.FLOAT, false, stride, 0);
        this.gl.enableVertexAttribArray(a_Position);

        let a_Color = this.gl.getAttribLocation(this.gl.program, 'a_Color');
        let colorOffset = 3 * 4; //12= offset, start på color-info innafor verteksinfoen.
        this.gl.vertexAttribPointer(a_Color, 4, this.gl.FLOAT, false, stride, colorOffset);
        this.gl.enableVertexAttribArray(a_Color);

        let modelviewMatrix = this.camera.getModelViewMatrix(modelMatrix);    //HER!!
        // Kopler matriseshaderparametre med tilsvarende Javascript-variabler:
        let u_modelviewMatrix = this.gl.getUniformLocation(this.gl.program, "u_modelviewMatrix");   // HER!!
        let u_projectionMatrix = this.gl.getUniformLocation(this.gl.program, "u_projectionMatrix"); // HER!!
        this.gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
        this.gl.uniformMatrix4fv(u_projectionMatrix, false, this.camera.projectionMatrix.elements);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexBufferCylinder.numberOfItems);


        this.stack.empty();
    }
}


