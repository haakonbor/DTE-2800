// Globale variabler:
/*
	LEGG MERKE TIL:
	- I dette eksemplet brukes to ulike shaderpar, et for koordinatsystemet og et for tegning av teksturert kvadrat.
	- Har derfor to forskjellige referanser til shaderprogrammene (gl.coordShaderProgram og gl.squareShaderProgram).
	- Må også aktivere korrekt shaderprogram før man tegner, f.eks.: gl.useProgram(gl.coordShaderProgram). Se draw-funksjonene.
	- Legg også merke til bruk av funksjonene bindShaderParameters(shaderProgram). Denne kalles i toppen av drawCoord() OG drawSquare() for å kople til matrisene.
 */

// Fragmentshader for koordinatsystemet:
let FSHADER_COORD_SOURCE =
	'precision mediump float;\n' +
	'varying vec4 v_Color;\n' +			// NB! Interpolert fargeverdi.
	'void main() {\n' +
	'  gl_FragColor = v_Color;\n' + 	// Setter gl_FragColor = Interpolert fargeverdi.
	'}\n';

let gl = null;
let canvas = null;

// Kameraposisjon:
let camPosX = 25;
let camPosY = 60;
let camPosZ = 100;
// Kamera ser mot ...
let lookAtX = 0;
let lookAtY = 0;
let lookAtZ = 0;
// Kameraorientering:
let upX = 0;
let upY = 1;
let upZ = 0;

// Tar vare på tastetrykk:
let currentlyPressedKeys = [];

// Verteksbuffer:
let squarePositionBuffer = null;
let squareTextureBuffer = null;
let squareTexture1 = null;
let squareTexture2 = null;

let coordPositionBuffer = null;
let coordColorBuffer = null;

let COORD_BOUNDARY = 100;

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

//Variabel for � beregne og vise FPS:
let fpsData = new Object();//{}; //Setter fpsData til en tomt objekt.

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

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function setupCamera() {
	// VIEW-matrisa:
	// cuon-utils: Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, lookAtX, lookAtY, lookAtZ, upX, upY, upZ)
	viewMatrix.setLookAt(camPosX, camPosY, camPosZ, lookAtX, lookAtY, lookAtZ, upX, upY, upZ);

	// PROJECTION-matrisa:
	// cuon-utils: Matrix4.prototype.setPerspective = function(fovy, aspect, near, far)
	projectionMatrix.setPerspective(45, canvas.width / canvas.height, 1, 1000);
}

function initCoordBuffer() {
	//KOORDINATSYSTEM:
	let coordPositions = new Float32Array([
		//x-aksen
		-COORD_BOUNDARY, 0.0, 0.0,
		COORD_BOUNDARY, 0.0, 0.0,

		//y-aksen:
		0.0, COORD_BOUNDARY, 0.0,
		0.0, -COORD_BOUNDARY, 0.0,

		//z-aksen:
		0.0, 0.0, COORD_BOUNDARY,
		0.0, 0.0, -COORD_BOUNDARY,
	]);

	//Ulike farge for hver akse:
	var coordColors = new Float32Array([
		1.0, 0.0, 0.0, 1,   // X-akse
		1.0, 0.0, 0.0, 1,
		0.0, 1.0, 0.0, 1,   // Y-akse
		0.0, 1.0, 0.0, 1,
		0.0, 0.0, 1.0, 1,   // Z-akse
		0.0, 0.0, 1.0, 1
	]);

	// Verteksbuffer for koordinatsystemet:
	coordPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coordPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, coordPositions, gl.STATIC_DRAW);
	coordPositionBuffer.itemSize = 3; 		// NB!!
	coordPositionBuffer.numberOfItems = 6; 	// NB!!
	gl.bindBuffer(gl.ARRAY_BUFFER, null);	// NB!! M� kople fra n�r det opereres med flere buffer! Kopler til i draw().

	//Fargebuffer: oppretter, binder og skriver data til bufret:
	coordColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coordColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, coordColors, gl.STATIC_DRAW);
	coordColorBuffer.itemSize = 4; 			// 4 float per farge.
	coordColorBuffer.numberOfItems = 6; 	// 6 farger.
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function initSquareBuffer(textureImage1, textureImage2) {
	let squarePositions = new Float32Array([
		-10, 0, 10,
		10, 0, 10,
		-10, 0, -10,
		10, 0, -10
	]);

	// Teksturkoordinater / UV-koordinater:
	let squareUVs = new Float32Array([
		0, 0,
		1, 0,
		0, 1,
		1, 1
	]);

	// POSISJON:
	squarePositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, squarePositions, gl.STATIC_DRAW);
	squarePositionBuffer.itemSize = 3; // NB!!
	squarePositionBuffer.numberOfItems = 4; // NB!!
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	//TEKSTUR-RELATERT:
	// Texture1:
	squareTexture1 = gl.createTexture();
	//Teksturbildet er nå lastet fra server, send til GPU:
	gl.bindTexture(gl.TEXTURE_2D, squareTexture1);
	//Unngaa at bildet kommer opp-ned:
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);   //NB! FOR GJENNOMSIKTIG BAKGRUNN!! Sett også gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//Laster teksturbildet til GPU/shader:
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage1);
	//Teksturparametre:
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	// NB! Dette gjør at bildet kan ha vilkårlig bredde og høyde.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// Texture2:
	squareTexture2 = gl.createTexture();
	//Teksturbildet er nå lastet fra server, send til GPU:
	gl.bindTexture(gl.TEXTURE_2D, squareTexture2);
	//Unngaa at bildet kommer opp-ned:
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);   //NB! FOR GJENNOMSIKTIG BAKGRUNN!! Sett også gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//Laster teksturbildet til GPU/shader:
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage2);
	//Teksturparametre:
	// NB! Dette gjør at bildet kan ha vilkårlig bredde og høyde.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// UV-koords:
	squareTextureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareTextureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, squareUVs, gl.STATIC_DRAW);
	squareTextureBuffer.itemSize = 2;
	squareTextureBuffer.numberOfItems = 4;
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
	setupCamera();
}

function drawCoord() {
	// NB! PASS PÅ DENNE DERSOM FLERE SHADERPAR ER I BRUK!
	// Binder shaderparametre:
	if (!bindShaderParameters(gl.coordShaderProgram))
		return;
	gl.useProgram(gl.coordShaderProgram);

	gl.bindBuffer(gl.ARRAY_BUFFER, coordPositionBuffer);
	let a_Position = gl.getAttribLocation(gl.coordShaderProgram, "a_Position");
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);

	gl.bindBuffer(gl.ARRAY_BUFFER, coordColorBuffer);
	let a_Color = gl.getAttribLocation(gl.coordShaderProgram, "a_Color");
	gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Color);

	//Still inn kamera:
	setupCamera();

	modelMatrix.setIdentity();
	// Sl�r sammen modell & view til modelview-matrise:
	modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkef�lge!

	// Sender matriser til shader:

	gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
	gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);

	// Tegner koordinatsystem:
	gl.drawArrays(gl.LINES, 0, coordPositionBuffer.numberOfItems);
}

function drawSquare() {

	// NB! PASS PÅ DENNE DERSOM FLERE SHADERPAR ER I BRUK!
	// Binder shaderparametre:
	if (!bindShaderParameters(gl.squareShaderProgram))
		return;
	gl.useProgram(gl.squareShaderProgram);

	//Teksturspesifikt:
	//Bind til teksturkoordinatparameter i shader:
	gl.bindBuffer(gl.ARRAY_BUFFER, squareTextureBuffer);
	let a_TextureCoord = gl.getAttribLocation(gl.squareShaderProgram, "a_TextureCoord");
	gl.vertexAttribPointer(a_TextureCoord, squareTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_TextureCoord);

	//Bruker to teksturer og samplere:
	let samplerLoc0 = gl.getUniformLocation(gl.squareShaderProgram, "uSampler0");
	gl.uniform1i(samplerLoc0, 0);

	let samplerLoc1 = gl.getUniformLocation(gl.squareShaderProgram, "uSampler1");
	gl.uniform1i(samplerLoc1, 1);

	//Aktiverer begge teksturer:
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, squareTexture1);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, squareTexture2);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	//Posisjonsspesifikt:
	gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
	let a_Position = gl.getAttribLocation(gl.squareShaderProgram, "a_Position");
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	//Still inn kamera:
	setupCamera();

	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	//Roter  om egen y-akse:
	modelMatrix.rotate(yRot, 0, 1, 0);
	// Sl�r sammen modell & view til modelview-matrise:
	modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkef�lge!
	// Sender matriser til shader:
	gl.uniformMatrix4fv(u_modelviewMatrix, false, modelviewMatrix.elements);
	gl.uniformMatrix4fv(u_projectionMatrix, false, projectionMatrix.elements);
	// Tegner trekanten:
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squarePositionBuffer.numberOfItems);
}

function draw(currentTime) {

	//Sørger for at draw kalles p� nytt:
	requestAnimFrame(draw);

	if (currentTime === undefined)
		currentTime = 0; 	//Udefinert f�rste gang.

	//Beregner og viser FPS:
	if (currentTime - fpsData.forrigeTidsstempel >= 1000) { //dvs. et sekund har forl�pt...
		//Viser FPS i .html ("fps" er definert i .html fila):
		document.getElementById("fps").innerHTML = fpsData.antallFrames;
		fpsData.antallFrames = 0;
		fpsData.forrigeTidsstempel = currentTime; //Brukes for � finne ut om det har g�tt 1 sekund - i s� fall beregnes FPS p� nytt.
	}

	//Tar h�yde for varierende frame rate:

	let elapsed = 0.0;			// Forl�pt tid siden siste kalle p� draw().
	if (lastTime !== 0.0)		// F�rst gang er lastTime = 0.0.
		elapsed = (currentTime - lastTime)/1000; // Deler p� 1000 for � operere med sekunder.
	lastTime = currentTime;						// Setter lastTime til currentTime.

	let yRotSpeed = 60; 	// Bestemmer hvor fort trekanten skal rotere (uavhengig av FR).
	yRot = yRot + (yRotSpeed * elapsed); 	// Gir ca 60 graders rotasjon per sekund - og 6 sekunder for en hel rotasjon.
	yRot %= 360;								// "Rull rundt" dersom yRot >= 360 grader.

	let orbRotSpeed = 5; 	// Bestemmer hvor fort trekanten skal rotere (uavhengig av FR).
	orbRot = orbRot + (orbRotSpeed * elapsed); 	// Gir ca 60 graders rotasjon per sekund - og 6 sekunder for en hel rotasjon.
	orbRot %= 360;								// "Rull rundt" dersom yRot >= 360 grader.

	//Rensk skjermen:
	gl.clear(gl.COLOR_BUFFER_BIT);

	// LESE BRUKERINPUT;
	handleKeys(elapsed);

	//TEGNER:
	drawCoord();
	drawSquare();

	//Øker antall frames med 1
	fpsData.antallFrames++;
}

// Sjekker om value er POT
function isPowerOfTwo1(value)
{
	if (value === 0)
		return false;
	while (value !== 1)
	{
		if (value % 2 !== 0)
			return false;
		value = value/2;
	}
	return true;
}

// Tekstur2 er nå lastet, fortsetter:
function texture2LoadedContinue(textureImage2) {
	// Initialiserer verteksbuffer:
	initSquareBuffer(textureImage1, textureImage2);
	initCoordBuffer();
	// Start animasjonsløkka:
	draw();
}

let textureImage1=null;
// Tekstur1 er nå lastet, last neste:
function texture1LoadedContinue(textureImage) {
	textureImage1 = textureImage;
	// Laster ned teksturfil fra server, fortsetter i textureLoadedContinue() når nedlastinga er ferdig:
	let textureUrl = "textures/leaves.png";
	const image2 = new Image();
	// onload-event:
	image2.onload = function() {
		document.getElementById("img2-width").innerHTML = image2.width;
		document.getElementById("img2-height").innerHTML = image2.height;
		texture2LoadedContinue(image2);
	};
	// onerror-event:
	image2.onerror = function() {
		alert("Finner ikke : " + textureUrl);
	}
	// Starter nedlasting...
	image2.src = textureUrl;
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
	// Square-shader:
	let squareVertexShaderSource = document.getElementById("square-vertex-shader").innerHTML;
	let squareFragmentShaderSource = document.getElementById("square-fragment-shader").innerHTML;
	gl.squareShaderProgram = createProgram(gl, squareVertexShaderSource, squareFragmentShaderSource);
	if (!gl.coordShaderProgram) {
		console.log('Feil ved initialisering av shaderkoden. Sjekk shaderkoden.');
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
	let textureUrl = "textures/stonewall_jpg.jpg";
	const image1 = new Image();
	// onload-event:
	image1.onload = function() {
		document.getElementById("img1-width").innerHTML = image1.width;
		document.getElementById("img1-height").innerHTML = image1.height;
		texture1LoadedContinue(image1);
	};
	// onerror-event:
	image1.onerror = function() {
		alert("Finner ikke : " + textureUrl);
	}
	// Starter nedlasting...
	image1.src = textureUrl;
}
