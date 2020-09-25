/**
 * Legger til SKYGGE vha. SpotLight
 *
 * Bruker standard javascript / WebGL-inputhåndtering (keyboard)
 * => wasd + pil opp / ned (fart)
 *
 * SE: http://learningthreejs.com/blog/2012/01/20/casting-shadows/
 */
//Globale varianbler:
let renderer;
let scene;
let camera;

//rotasjoner
let angle = 0.0;
let lastTime = 0.0;

//Roter & zoom:
let controls; //rotere, zoome hele scenen.

let SIZE = 200;

let helicopter;									//Helikoptermodellen.
let heliSpeed = 0.2;							//Helokoptrets hastighet.
let speedVector = new THREE.Vector3(0.3,0,0.1);		//Fartsvektor.
let positionVector = new THREE.Vector3(0.3,0,0.1); 	//Posisjonsvetor.
let delta = Math.PI/100;  						//Hvor mye fartsvektoren roterer
let axis = new THREE.Vector3( 0, 1, 0 );		//Hvilken akse fartsvektoren roterer rundt.
let arrowHelper;                                // Fartsvektor (illustrert)

//Tar vare på tastetrykk:
let currentlyPressedKeys = {};

import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	//Lager en scene:
	scene = new THREE.Scene();

	//Lager et rendererobjekt (og setter størrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true; //NB!
	renderer.shadowMapType = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;

	//Oppretter et kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.x = 130;
	camera.position.y = 200;
	camera.position.z = 130;
	camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);

    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff); //hvitt lys
	spotLight.position.set( 0, 400, 0 );
	spotLight.castShadow = true;
	spotLight.shadowMapWidth = 512;	//Gir bedre kvalitet p� skyggen.
	spotLight.shadowMapHeight = 512;
	spotLight.shadowCameraNear = 200; 	//Justerer lysets "frustum".
	spotLight.shadowCameraFar = 410;
	//spotLight.shadowCameraFov = 30;
	spotLight.shadowCameraVisible = true;		//NB!! Viser lyskildens posisjon og utstrekning.

	scene.add(spotLight);

	//Retningsorientert lys:
	let directionalLight = new THREE.DirectionalLight(0x5055ff, 1.0); //farge, intensitet (1=default)
	directionalLight.position.set(2, 1, 4);
	scene.add(directionalLight);

	//Legg modeller til scenen:
	addModels();

	//Koordinatsystem:
	addCoordSystem();

	//Roter/zoom hele scenen:
	addControls();

    //Håndterer endring av vindusstørrelse:
    window.addEventListener('resize', onWindowResize, false);

    //Input - standard Javascript / WebGL:
    document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	animate();
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function addModels() {
	//Plan:
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2 );
	let mPlane = new THREE.MeshLambertMaterial( {color: 0x91afff, side: THREE.DoubleSide } );
	let meshPlane = new THREE.Mesh( gPlane, mPlane);
	meshPlane.rotation.x = Math.PI / 2;
	meshPlane.receiveShadow = true;	//NB!
	scene.add(meshPlane);

	//Fartsvektor (illustrert):
	arrowHelper = new THREE.ArrowHelper(speedVector, new THREE.Vector3(0, 0.01, 0), heliSpeed*100, 0xff0000);
	scene.add(arrowHelper);

	//Helikopter:
	addHeliModel();
}

function addHeliModel() {
	//Konteiner:
	helicopter = new THREE.Object3D();

	//Cockpit:
	let texCocpit = THREE.ImageUtils.loadTexture('images/metal1.jpg');
	let gCockpit = new THREE.SphereGeometry(5, 32, 32);
	let mCockpit = new THREE.MeshPhongMaterial({ map: texCocpit });
	let meshCockpit = new THREE.Mesh(gCockpit, mCockpit);
	meshCockpit.castShadow = true;
	meshCockpit.name = "cockpit";
	meshCockpit.position.x = 0;
	meshCockpit.position.y = 0;
	meshCockpit.position.z = 0;
	helicopter.add(meshCockpit);

	//Body:
	let texBody = THREE.ImageUtils.loadTexture('images/metal1.jpg');
	let gBody = new THREE.CylinderGeometry(1.0, 4, 12, 8, 4, false);
	let mBody = new THREE.MeshPhongMaterial({ map: texBody });
	let meshBody = new THREE.Mesh(gBody, mBody);
	meshBody.castShadow = true;
	meshBody.name = "body";
	meshBody.rotation.z = Math.PI / 2;
	meshBody.position.x = -7;
	meshBody.position.y = 0;
	meshBody.position.z = 0;
	helicopter.add(meshBody);

	//Rotor:
	let gRotor = new THREE.BoxGeometry(0.2, 20, 1);
	let mRotor = new THREE.MeshBasicMaterial({ color:0x00de88});
	let meshRotor = new THREE.Mesh(gRotor, mRotor);
	meshRotor.name = "rotor";
	meshRotor.rotation.z = Math.PI / 2;
	meshRotor.rotation.y = Math.PI / 5;
	meshRotor.position.x = 0;
	meshRotor.position.y = 5;
	meshRotor.position.z = 0;
	meshRotor.castShadow = true;
	helicopter.add(meshRotor);

	//Bakrotor:
	let gBRotor = new THREE.BoxGeometry(5, 1, 0.2);
	let mBRotor = new THREE.MeshBasicMaterial({ color:0x00de88});
	let meshBRotor = new THREE.Mesh(gBRotor, mBRotor);
	meshBRotor.name = "bakrotor";
	meshBRotor.position.x = -13.0;
	meshBRotor.position.y = 1;
	meshBRotor.position.z = 0;
	helicopter.add(meshBRotor);

    scene.add(helicopter);

    //Flytter hele helikoptret:
    helicopter.position.y = 100;
}

//Legger til roter/zoom av scenen:
function addControls() {
	controls = new TrackballControls(camera);
	controls.addEventListener( 'change', render);
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 10;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
}

//Koordinatsystemet:
function addCoordSystem() {
	addAxis(1); //x-aksen.
	addAxis(2); //y-aksen.
	addAxis(3); //z-aksen.
}

//Legger til enkeltakse (stiplet for negativ del av aksen)
//Bruker Geometry - klassen til å lage egne "modeller", her akser som
//hver består av to punkter av type THREE.Vector3()
function addAxis(axis) {
	let fromNeg=new THREE.Vector3( 0, 0, 0 );
	let toNeg=new THREE.Vector3( 0, 0, 0 );
	let fromPos=new THREE.Vector3( 0, 0, 0 );
	let toPos=new THREE.Vector3( 0, 0, 0 );
	let axiscolor = 0x000000;

	switch (axis) {
	case 1: //x-aksen
		fromNeg=new THREE.Vector3( -SIZE, 0, 0 );;
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( SIZE, 0, 0 );
		axiscolor = 0xff0000;
		break;
	case 2: //y-aksen
		fromNeg=new THREE.Vector3( 0, -SIZE, 0 );
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( 0, SIZE, 0 );
		axiscolor = 0x00ff00;
		break;
	case 3: //z-aksen
		fromNeg=new THREE.Vector3( 0, 0, -SIZE );
		toNeg=new THREE.Vector3( 0, 0, 0 );
		fromPos=new THREE.Vector3( 0, 0, 0 );
		toPos=new THREE.Vector3( 0, 0, SIZE );
		axiscolor = 0x0000ff;
		break;
	}

	let posMat = new THREE.LineBasicMaterial({ linewidth: 2, color: axiscolor });
	let negMat = new THREE.LineDashedMaterial({ linewidth: 2, color: axiscolor, dashSize: 0.5, gapSize: 0.1 });

    let gNeg = new THREE.Geometry();
    gNeg.vertices.push( fromNeg );
    gNeg.vertices.push( toNeg );
    let coordNeg = new THREE.Line(gNeg, negMat, THREE.LineSegments);
    coordNeg.computeLineDistances(); // NB!
    scene.add(coordNeg);

    let gPos = new THREE.Geometry();
    gPos.vertices.push( fromPos );
    gPos.vertices.push( toPos );
    let coordPos = new THREE.Line(gPos, posMat, THREE.LineSegments);
    coordPos.computeLineDistances();
    scene.add(coordPos);
}

function animate(currentTime) {
	requestAnimationFrame(animate);
	if (currentTime == undefined)
	    currentTime = 0; //Udefinert første gang.

	let elapsed = 0.0; 			// Forløpt tid siden siste kall på draw().
	if (lastTime != 0.0) 		// Først gang er lastTime = 0.0.
		elapsed = (currentTime - lastTime)/1000; //Opererer med sekunder.

	lastTime = currentTime;

	let rotationSpeed = (Math.PI); // Bestemmer rotasjonshastighet.
	angle = angle + (rotationSpeed * elapsed);
	angle %= (Math.PI * 2); // "Rull rundt" dersom angle >= 360 grader.

	//Roterer helikoptrets rotor:
	let rotor = helicopter.getObjectByName("rotor", true);  //true = recursive...
	if (rotor != undefined)
		rotor.rotation.y = angle;
	let bakrotor = helicopter.getObjectByName("bakrotor", true);  //true = recursive...
	if (bakrotor != undefined)
		bakrotor.rotation.z = angle;

	// Oppdaterer posisjonsvektoren vha. fartsvektoren:
	positionVector.x = positionVector.x + (speedVector.x * heliSpeed);
	positionVector.y = 0;
	positionVector.z = positionVector.z + (speedVector.z * heliSpeed);

	// Bruker posisjonsvektoren til å oppdatere helikoptrets posisjon:
	helicopter.position.x = positionVector.x;
	helicopter.position.z = positionVector.z;

	// Roterer helikoptret i forhold til fartsvektoren:
	helicopter.rotation.y = getRotationAngleUsingAtan2();

	// Illustrerer fartsvektoren:
	arrowHelper.setDirection(speedVector);
	arrowHelper.setLength(heliSpeed*100);

	//Sjekker input:
	keyCheck();

	//Oppdater trackball-kontrollen:
	controls.update();

	//Tegner scenen med gitt kamera:
	render();
};

//Sjekker tastaturet (standard Javascript/WebGL):
function keyCheck() {

	if (currentlyPressedKeys[65]) { //A
		let matrix = new THREE.Matrix4().makeRotationAxis( axis, delta );
	   	speedVector.applyMatrix4( matrix );
    }
    if (currentlyPressedKeys[83]) {	//S
    	heliSpeed-=0.01;
		if (heliSpeed<=0)
			heliSpeed = 0.0;
    }
    if (currentlyPressedKeys[87]) {	//W
    	heliSpeed+=0.01;
		if (heliSpeed>=10)
			heliSpeed = 1.0;
    }
    if (currentlyPressedKeys[68]) {	//D
    	let matrix = new THREE.Matrix4().makeRotationAxis( axis, -delta );
	   	speedVector.applyMatrix4( matrix );
    }

    //Høyde (V/B):
    if (currentlyPressedKeys[86]) { //V
    	helicopter.position.y -= 0.3;
    }
    if (currentlyPressedKeys[66]) {	//B
    	helicopter.position.y += 0.3;
    }
}

function render()
{
     renderer.render(scene, camera);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.handleResize();
    render();
}

/*
	Fra: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
	The Math.atan2() function returns the angle in the plane (in radians) between the positive x-axis
	and the ray from (0,0) to the point (x,y), for Math.atan2(y,x).

	Math.atan2() opererer med et standard 2D koordinatsystem med positiv Y oppover og positiv X til høyre.
	Her opererer vi imidlertid i x/z-planet der z-aksen vil ha motsatt fortegn i forhold til
	tilsvarende y-akse i 2D. Tenk deg at du "bikker" XY-systemet bakover slik at det blir liggende
	oppå XZ-planet: +Y vil da tilsvare -Z

	Math.atan2() opererer med et "normalt" 2D XY-system.
	Vi må derfor trekke fra 90 grader når vi bruker Atan2() funksjonen.
 */
function getRotationAngleUsingAtan2()
{
	return Math.atan2(speedVector.x, speedVector.z) - Math.PI / 2;
}
