// Globale variabler:
/*
	LEGG MERKE TIL:
	- I dette eksemplet brukes to ulike shaderpar, et for koordinatsystemet og et for tegning av teksturert kube.
	- Har derfor to forskjellige referanser til shaderprogrammene (gl.coordShaderProgram og gl.cubeShaderProgram).
	- Må også aktivere korrekt shaderprogram før man tegner, f.eks.: gl.useProgram(gl.coordShaderProgram). Se draw-funksjonene.
	- Legg også merke til bruk av funksjonene bindShaderParameters(shaderProgram). Denne kalles i toppen av drawCoord() OG drawCube() for å kople til matrisene.
 */

let gl = null;
let canvas = null;


// Tar vare på tastetrykk:
let currentlyPressedKeys = [];

// "Pekere" som brukes til � sende matrisene til shaderen:
let u_modelviewMatrix = null;
let u_projectionMatrix = null;

// Matrisene:
let modelMatrix = null;
let viewMatrix = null;
let modelviewMatrix = null;
let projectionMatrix = null;

//Animasjon:
let yRot = 0.0;
let orbRot = 0.0;
let lastTime = 0.0;
let scale = 1.0;

//Variabel for å beregne og vise FPS:
let fpsData = {};//{}; //Setter fpsData til en tomt objekt.

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}


//NB! Denne tar i mot aktuelt shaderprogram som parameter:
function bindShaderParameters(shaderProgram) {
	// Kopler shaderparametre med Javascript-variabler:
	// Matriser: u_modelviewMatrix & u_projectionMatrix
	u_modelviewMatrix = gl.getUniformLocation(shaderProgram, "u_modelviewMatrix");
	u_projectionMatrix = gl.getUniformLocation(shaderProgram, "u_projectionMatrix");
	return true;
}

function handleKeys(elapsed) {

	let camPosVec = vec3.fromValues(camPosX, camPosY, camPosZ);
	//Enkel rotasjon av kameraposisjonen:
	if (currentlyPressedKeys[65]) {    //A
		rotateVector(2, camPosVec, 0, 1, 0);  //Roterer camPosVec 2 grader om y-aksen.
	}
	if (currentlyPressedKeys[68]) {	//S
		rotateVector(-2, camPosVec, 0, 1, 0);  //Roterer camPosVec 2 grader om y-aksen.
	}
	if (currentlyPressedKeys[87]) {	//W
		rotateVector(2, camPosVec, 1, 0, 0);  //Roterer camPosVec 2 grader om x-aksen.
	}
	if (currentlyPressedKeys[83]) {	//D
		rotateVector(-2, camPosVec, 1, 0, 0);  //Roterer camPosVec 2 grader om x-aksen.
	}

	//Zoom inn og ut:
	if (currentlyPressedKeys[86]) { //V
		vec3.scale(camPosVec, camPosVec, 1.05);
	}
	if (currentlyPressedKeys[66]) {	//B
		vec3.scale(camPosVec, camPosVec, 0.95);
	}

	camPosX = camPosVec[0];
	camPosY = camPosVec[1];
	camPosZ = camPosVec[2];

	//Sving på hjulene
	if (currentlyPressedKeys[37] && steeringRot < 25) { //Venstre piltast
		steeringRot+=1;
	}
	if (currentlyPressedKeys[39] && steeringRot > -25) {	//Høyre piltast
		steeringRot-=1;
	}

	// LYSKILDENS POSISJON:
	// x-pos:
	if (currentlyPressedKeys[89]) {     //Y
		pointLightPos.x += 0.5;
	}
	if (currentlyPressedKeys[85]) {	    //U
		pointLightPos.x -= 0.5;
	}
	//y-pos
	if (currentlyPressedKeys[72]) {    //H
		pointLightPos.y += 0.5;
	}
	if (currentlyPressedKeys[74]) {	//J
		pointLightPos.y -= 0.5;
	}
	//z-pos
	if (currentlyPressedKeys[78]) {    //H
		pointLightPos.z += 0.5;
	}
	if (currentlyPressedKeys[77]) {	//J
		pointLightPos.z -= 0.5;
	}

	setupCamera();
}

function draw(currentTime) {

	//Sørger for at draw kalles p� nytt:
	requestAnimFrame(draw);

	// GJENNOMSIKTIGHET:
	// Aktiverer fargeblanding (&indirekte gjennomsiktighet):
	//gl.enable(gl.BLEND);
	// Angir blandefunksjon:
	//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// Dybdetest
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LESS);

	//NB! Backface Culling:
	gl.frontFace(gl.CCW);		//indikerer at trekanter med vertekser angitt i CCW er front-facing!
	gl.enable(gl.CULL_FACE);	//enabler culling.
	gl.cullFace(gl.BACK);		//culler baksider.

	if (currentTime === undefined)
		currentTime = 0; 	//Udefinert f�rste gang.

	//Beregner og viser FPS:
	if (currentTime - fpsData.forrigeTidsstempel >= 1000) { //dvs. et sekund har forl�pt...
		//Viser FPS i .html ("fps" er definert i .html fila):
		document.getElementById("fps").innerHTML = fpsData.antallFrames;
		fpsData.antallFrames = 0;
		fpsData.forrigeTidsstempel = currentTime; //Brukes for � finne ut om det har g�tt 1 sekund - i s� fall beregnes FPS p� nytt.
	}

	//Tar høyde for varierende frame rate:
	let elapsed = 0.0;			// Forl�pt tid siden siste kalle p� draw().
	if (lastTime !== 0.0)		// F�rst gang er lastTime = 0.0.
		elapsed = (currentTime - lastTime)/1000; // Deler p� 1000 for � operere med sekunder.
	lastTime = currentTime;						// Setter lastTime til currentTime.

	//Rensk skjermen:
	gl.clear(gl.COLOR_BUFFER_BIT);

	// LESE BRUKERINPUT;
	handleKeys(elapsed);

	//TEGNER:
	drawCoord();
	modelMatrix.translate(0,3,0);
	drawCar();
	modelMatrix.translate(15,0,15);
	drawCar();
	//drawCube(modelMatrix);
	//modelMatrix.translate(2,1,2);
	//drawCube(modelMatrix);
	drawXZPlane();
	drawLightSource();

	//Øker antall frames med 1
	fpsData.antallFrames++;
}

function initContext() {
	// Hent <canvas> elementet
	canvas = document.getElementById('webgl');

	// Rendering context for WebGL:
	gl = getWebGLContext(canvas);
	if (!gl) {
		console.log("Fikk ikke tak i rendering context for WebGL");
		return false;
	}

	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	return true;
}

function textureLoadedContinue(textureImage) {
	// Initialiserer verteksbuffer:
	//initCubeBuffer();
	initCarBuffers()
	initCoordBuffer();
	initXZPlaneBuffer(textureImage);
	initLightSourceBuffer();
	// Start animasjonsløkka:
	draw();
}

// Sjekker om value er POT
function isPowerOfTwo(value) {
	return (value & (value - 1)) == 0;  //?
}

function main() {

	if (!initContext())
		return;

	// Initialiser shadere (cuon-utils).
	// I dette eksemplet brukes to ulike shaderpar.

	// Coord-shader (fra html-fila):
	let coordVertexShaderSource = document.getElementById("coord-vertex-shader").innerHTML;
	let coordFragmentShaderSource = document.getElementById("coord-fragment-shader").innerHTML;
	gl.coordShaderProgram = createProgram(gl, coordVertexShaderSource, coordFragmentShaderSource);
	if (!gl.coordShaderProgram) {
		console.log('Feil ved initialisering av shaderkoden til coord. Sjekk shaderkoden.');
		return;
	}
	// Cube-shader:
	let cubeVertexShaderSource = document.getElementById("cube-vertex-shader").innerHTML;
	let cubeFragmentShaderSource = document.getElementById("cube-fragment-shader").innerHTML;
	gl.cubeShaderProgram = createProgram(gl, cubeVertexShaderSource, cubeFragmentShaderSource);
	if (!gl.cubeShaderProgram) {
		console.log('Feil ved initialisering av shaderkoden til kuben. Sjekk shaderkoden.');
		return;
	}
	// xzplane-shader: BRUK ENTEN xzplane-gourad-vertex-shader ELLER xzplane-phong-vertex-shader
	let xzplaneVertexShaderSource = document.getElementById("xzplane-phong-vertex-shader").innerHTML;
	let xzplaneFragmentShaderSource = document.getElementById("xzplane-phong-fragment-shader").innerHTML;
	gl.xzplaneShaderProgram = createProgram(gl, xzplaneVertexShaderSource, xzplaneFragmentShaderSource);
	if (!gl.xzplaneShaderProgram) {
		console.log('Feil ved initialisering av shaderkoden til planet. Sjekk shaderkoden.');
		return;
	}
	// Circle-shader:
	let circleVertexShaderSource = document.getElementById("circle-vertex-shader").innerHTML;
	let circleFragmentShaderSource = document.getElementById("circle-fragment-shader").innerHTML;
	gl.circleShaderProgram = createProgram(gl, circleVertexShaderSource, circleFragmentShaderSource);
	if (!gl.circleShaderProgram) {
		console.log('Feil ved initialisering av shaderkoden til sirkelen. Sjekk shaderkoden.');
		return;
	}

	// LightSource - shader:
	let lightSourceVertexShaderSource = document.getElementById("light-source-vertex-shader").innerHTML;
	let lightSourceFragmentShaderSource = document.getElementById("light-source-fragment-shader").innerHTML;
	gl.lightSourceShaderProgram = createProgram(gl, lightSourceVertexShaderSource, lightSourceFragmentShaderSource);
	if (!gl.lightSourceShaderProgram) {
		console.log('Feil ved initialisering av light-source-shaderkoden. Sjekk shaderkoden.');
		return;
	}

	//Initialiserer matrisene:
	modelMatrix = new Matrix4();
	viewMatrix = new Matrix4();
	modelviewMatrix = new Matrix4();
	projectionMatrix = new Matrix4();

	// Setter bakgrunnsfarge:
	gl.clearColor(0.8, 0.8, 0.8, 1.0); //RGBA

	// Laster ned teksturfil fra server, fortsetter i textureLoadedContinue() når nedlastinga er ferdig:
	let XZPlaneTextureUrl = "textures/gress.png";
	const XZPlaneImage = new Image();
	// onload-event:
	XZPlaneImage.onload = function() {
		if (isPowerOfTwo(XZPlaneImage.width) && isPowerOfTwo(XZPlaneImage.height)) {
			textureLoadedContinue(XZPlaneImage);
		} else {
			alert("Teksturens høyde og/eller bredde er ikke POT!");
		}
	};

	// onerror-event:
	XZPlaneImage.onerror = function() {
		alert("Finner ikke : " + XZPlaneTextureUrl);
	}
	// Starter nedlasting...
	XZPlaneImage.src = XZPlaneTextureUrl;
}
