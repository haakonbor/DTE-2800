/**
 * Terreng & kart. Fra: http://blog.thematicmapping.org/2013/10/textural-terrains-with-threejs.html
 * Høydeverdiene ligger i en .bin fil.
 */
//Globale varianbler:
let renderer;
let scene;
let camera;

//rotasjoner
let angle = 0.0;
let lastTime = 0.0;

//Roter & zoom:
let controls; //rotere, zoone hele scenen.

let SIZE = 1000;

let helicopter;									//Helikoptermodellen.
let heliSpeed = 10;								//Helokoptrets hastighet.
let speedVector = new THREE.Vector3(-0.1,0,-0.2);		//Fartsvektor.
let positionVector = new THREE.Vector3(-3,0,-1); 	//Posisjonsvetor.
let delta = Math.PI/100;  						//Hvor mye fartsvektoren roterer
let axis = new THREE.Vector3( 0, 1, 0 );		//Hvilken akse fartsvektoren roterer rundt.

//Tar vare på tastetrykk:
let currentlyPressedKeys = {};

//Figurer som helikoptret kan kræsje i:
let collidableMeshList = [];

//Terreng:
let isTerrainLoaded = false;
let meshTerrain;

import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { fineCollisionTest, coarseCollisionTest } from "../../lib/wfa-collision.js";
import { loadTerrain } from "../../lib/wfa-utils.js";

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
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
	camera.position.x = 360;
	camera.position.y = 400;
	camera.position.z = 390;
	camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);

    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff, 0.5); //hvitt lys
	spotLight.position.set( 0, 800, 0 );
	spotLight.castShadow = true;
	spotLight.shadowMapWidth = 1024;
	spotLight.shadowMapHeight = 1024;
	spotLight.shadowCameraNear = 200;
	spotLight.shadowCameraFar = 810;
	//spotLight.shadowCameraVisible = true;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);

	//Retningsorientert lys:
	let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight1.position.set(2, 1, 4);
	scene.add(directionalLight1);

	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight2.position.set(-2, 1, -4);
	scene.add(directionalLight2);

	//Ambient:
	//scene.add(new THREE.AmbientLight(0xeeeeee));

	//Legg modeller til scenen:
	addTerrain();

	//Koordinatsystem:
	addCoordSystem();

	//Roter/zoom hele scenen:
	addControls();

    //Håndterer endring av vindusstørrelse:
    window.addEventListener('resize', onWindowResize, false);

    //Input - standard Javascript / WebGL:
    document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	// Høydeverdiene ligger i en .bin fil (200x200 = 40000 verdier).
	loadTerrain("assets/jotunheimen.bin", terrainLoaded); 	// lib/wfa-utils.js
	animate();
}

function terrainLoaded(terrainArray) {
    //terrainArray = et array bestående av 16 bits heltall. jotunheimen.bin = 40000 16 bits heltall
    let noVertices = meshTerrain.geometry.vertices.length;
	for (let i = 0, len = noVertices; i < len; i++) {
		meshTerrain.geometry.vertices[i].z = terrainArray[i] / 30000 * 70;
	}
	isTerrainLoaded = true;
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function addTerrain() {
	//Gir 199 x 199 ruter (hver bestående av to trekanter). Texturen er 200x200 piksler.
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2, 199, 199 );
	let mPlane = new THREE.MeshPhongMaterial({
		//color: 0x91aff11,
		map: THREE.ImageUtils.loadTexture('images/jotunheimen-texture.png')
	});
	// Bruker IKKE tiling her, teksturen dekker hele planet.
	meshTerrain = new THREE.Mesh( gPlane, mPlane);
	meshTerrain.rotation.x = -Math.PI / 2;
	meshTerrain.receiveShadow = true;	//NB!
	scene.add(meshTerrain);

	//Helikopter:
	addHeliModel();

	//Kube:
	//Definerer geometri og materiale (her kun farge) for en kube:
	let gCube = new THREE.BoxGeometry(40, 40, 40);
	let tCube = THREE.ImageUtils.loadTexture("images/bird1.png");
	let mCube = new THREE.MeshPhongMaterial({map : tCube});
	let cube = new THREE.Mesh(gCube, mCube);
	//Legger kuben til scenen:
	cube.position.x = -70;
	cube.position.y = 120;
	cube.position.z = -100;
	cube.castShadow = true;
	cube.receiveShadow = true;	//NB!
	cube.geometry.computeBoundingSphere();
	scene.add(cube);
	collidableMeshList.push(cube);
}

function addHeliModel() {
	//Konteiner:
	helicopter = new THREE.Object3D();

	//Cockpit:
	let texCocpit = THREE.ImageUtils.loadTexture('images/metal1.jpg');
	let gCockpit = new THREE.SphereGeometry(5, 16, 16);					//radius, widthSegments, heightSegments,
	gCockpit.computeBoundingSphere();
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
	gBody.computeBoundingSphere();
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
	let texRotor = THREE.ImageUtils.loadTexture('images/chocchip.png');
	let gRotor = new THREE.BoxGeometry(0.2, 20, 1);
	gRotor.computeBoundingSphere();
	let mRotor = new THREE.MeshPhongMaterial({ map: texRotor });//new THREE.MeshBasicMaterial({ color:0x00de88});
	let meshRotor = new THREE.Mesh(gRotor, mRotor);
	meshRotor.name = "rotor";
	meshRotor.rotation.z = Math.PI / 2;
	meshRotor.rotation.y = Math.PI / 5;
	meshRotor.position.x = 0;
	meshRotor.position.y = 5;
	meshRotor.position.z = 0;
	meshRotor.castShadow = true;	//Skygge fra rotoren.
	helicopter.add(meshRotor);

	//Bakrotor:
	let gBRotor = new THREE.BoxGeometry(5, 1, 0.2);
	gBRotor.computeBoundingSphere();
	let mBRotor = new THREE.MeshPhongMaterial({ map: texRotor });//new THREE.MeshBasicMaterial({ color:0x00de88});
	let meshBRotor = new THREE.Mesh(gBRotor, mBRotor);
	meshBRotor.name = "bakrotor";
	meshBRotor.position.x = -13.0;
	meshBRotor.position.y = 1;
	meshBRotor.position.z = 0;
	helicopter.add(meshBRotor);

    scene.add(helicopter);

    //Skygge?
    helicopter.castShadow = true;	//NB!
    //Flytter hele helikoptret:
    helicopter.position.y = 170;
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
	if (isTerrainLoaded) {
		if (currentTime == undefined)
		    currentTime = 0;

		let elapsed = 0.0;
		if (lastTime != 0.0)
			elapsed = (currentTime - lastTime)/1000; //Opererer med sekunder.

		lastTime = currentTime;

		let rotationSpeed = (Math.PI); // Bestemmer rotasjonshastighet.
		angle = angle + (rotationSpeed * elapsed);
		angle %= (Math.PI * 2); // "Rull rundt" dersom angle >= 360 grader.

		//Roterer helikoptrets rotor:
		let rotor = helicopter.getObjectByName("rotor", true);  //true = recursive...
		//showDebug("rotor.name=" + rotor.name);
		if (rotor != undefined)
			rotor.rotation.y = angle;
		let bakrotor = helicopter.getObjectByName("bakrotor", true);  //true = recursive...
		if (bakrotor != undefined)
			bakrotor.rotation.z = angle;

		positionVector.x = positionVector.x + (speedVector.x * heliSpeed * elapsed);
		positionVector.y = 0;
		positionVector.z = positionVector.z + (speedVector.z * heliSpeed * elapsed);

		helicopter.position.x = positionVector.x;
		helicopter.position.z = positionVector.z;

		helicopter.rotation.y = getRotationAngleUsingAtan2();

		//Sjekker input:
		keyCheck(elapsed);

		//Kollisjonsdeteksjon:
		collisionTest();

		//Oppdater trackball-kontrollen:

		controls.update();
		//Tegner scenen med gitt kamera:
		render();
	}
};

//Sjekker tastaturet:
function keyCheck(elapsed) {

	//HELIKOPTER:
	//Rotasjon og fart:
	if (currentlyPressedKeys[65]) { //A
		let matrix = new THREE.Matrix4().makeRotationAxis( axis, delta );
	   	speedVector.applyMatrix4( matrix );
    }
    if (currentlyPressedKeys[83]) {	//S
    	heliSpeed-=1;
		if (heliSpeed<=0)
			heliSpeed = 0.0;
    }
    if (currentlyPressedKeys[87]) {	//W
    	heliSpeed+=1;
		if (heliSpeed>=200)
			heliSpeed = 200.0;
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

function collisionTest() {
	//Sjekker de ulike helikopterdelene mot collidableMeshList dvs. kubene:
	let cockpit = helicopter.getObjectByName("cockpit", true);
	cockpit.updateMatrixWorld();
	collisionTestMesh(cockpit);
	let body = helicopter.getObjectByName("body", true);
	body.updateMatrixWorld();
	collisionTestMesh(body);
	let rotor = helicopter.getObjectByName("rotor", true);
	rotor.updateMatrixWorld();
	collisionTestMesh(rotor);
}

function collisionTestMesh(_mesh) {
	//Gjør først grovsjekk vha. boundingsphere:
	if (coarseCollisionTest(_mesh, collidableMeshList)) {		//Se wfa-collision.js
		//Dersom overlapp mellom sfærene gjøres en finere sjekk vha. Raycast
		if (fineCollisionTest(_mesh, collidableMeshList)) {  	//Se wfa-collision.js
			heliSpeed = 0;
			positionVector = new THREE.Vector3(-3,0,-1);
		}
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
    if (isTerrainLoaded)
    	render();
}

function getRotationAngleUsingAtan2()
{
	return Math.atan2(speedVector.x, speedVector.z) - Math.PI / 2;
}
