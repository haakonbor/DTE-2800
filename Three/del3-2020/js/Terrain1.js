/**
 * Terreng vha. heightmap (heightmap.png)
 *
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
let speedVector = new THREE.Vector3(-3,0,-1);		//Fartsvektor.
let positionVector = new THREE.Vector3(-3,0,-1); 	//Posisjonsvetor.
let delta = Math.PI/100;  						//Hvor mye fartsvektoren roterer
let axis = new THREE.Vector3( 0, 1, 0 );		//Hvilken akse fartsvektoren roterer rundt.

//Tar vare på tastetrykk:
let currentlyPressedKeys = {};

//Figurer som helikoptret kan kr�sje i:
let collidableMeshList = [];

//Terreng:
let meshTerrain;
let isTerrainHeightLoaded = false;

import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { fineCollisionTest, coarseCollisionTest } from "../../lib/wfa-collision.js";
import { getHeightData } from "../../lib/wfa-utils.js";

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	//Scene:
	scene = new THREE.Scene();

	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true; //NB!
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;

	//Kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
	camera.position.x = 130;
	camera.position.y = 200;
	camera.position.z = 150;
	camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);

    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff, 0.5); //hvitt lys
	spotLight.position.set( 1000, 3000, 2000 );
	spotLight.castShadow = true;
	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;
	spotLight.shadow.camera.near = 200;
	spotLight.shadow.camera.far = 3500;
	//spotLight.shadowCameraVisible = false;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);

	//Punktlys:
    let pointLight1 = new THREE.PointLight( 0xffffff, 1, 2000 );
    pointLight1.position.set( 0, 700, 0 );
    scene.add( pointLight1 );

	//Ambient:
	scene.add(new THREE.AmbientLight(0x221133));

	//Koordinatsystem:
	let axesHelper = new THREE.AxesHelper( SIZE*2 );
	scene.add( axesHelper );

	//Terreng:
	addTerrain();
	//Helikopter:
	addHeliModel();

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

//Denne kjøres når høydedata er ferdiga lastet og generert:
function terrainHeightLoaded(heightData) {
	//terrainArray = et array bestående av 16 bits heltall.
	for (let i = 0, len = meshTerrain.geometry.vertices.length; i < len; i++) {
		meshTerrain.geometry.vertices[i].z = heightData[i];
	}
	meshTerrain.geometry.computeVertexNormals();
	isTerrainHeightLoaded = true;
}

function addTerrain() {
	let planeNoTiles = 128-1; //heightmap.png har størrelse = 128 x 128 piksler.
	/* FRA DOC:
		PlaneGeometry(width : Float, height : Float, widthSegments : Integer, heightSegments : Integer)
		width — Width along the X axis. Default is 1.
		height — Height along the Y axis. Default is 1.
		widthSegments — Optional. Default is 1.
		heightSegments — Optional. Default is 1.
	*/
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2, planeNoTiles, planeNoTiles );
	gPlane.computeVertexNormals();

	// Texture tiling (f.eks. 20 x 20 rutenett med gjenbruk av tekstur):
	// NB! Texture tiling er uavhengig av plan-rutenettet:
	let textureLoader = new THREE.TextureLoader();
	textureLoader.load( "images/tile2.png", function( textureMap ) {
		textureMap.wrapS = THREE.RepeatWrapping;
		textureMap.wrapT = THREE.RepeatWrapping;
		textureMap.repeat.x = 20;
		textureMap.repeat.y = 20;

		let mPlane = new THREE.MeshLambertMaterial(
			{
				color: '#f9e679',
				side: THREE.DoubleSide,
				map: textureMap,
				shading: THREE.SmoothShading,
				wireframe: false,
			});
		meshTerrain = new THREE.Mesh( gPlane, mPlane);
		meshTerrain.translateY(-300);
		meshTerrain.rotation.x = -Math.PI / 2;
		meshTerrain.receiveShadow = true;	//NB!
		scene.add(meshTerrain);

		//Laster fil med høydedata for planet (/lib/wfa-utils.js):
		getHeightData('images/heightmap3.png', 128, 128, terrainHeightLoaded);
	});
}

function addHeliModel() {
	//Konteiner:
	helicopter = new THREE.Object3D();
	let textureLoader = new THREE.TextureLoader();
	//Cockpit:
	textureLoader.load( "images/metal1.jpg", function( texCocpit ) {
		let gCockpit = new THREE.SphereGeometry(5, 16, 16);					//radius, widthSegments, heightSegments,
		gCockpit.computeBoundingSphere();
		let mCockpit = new THREE.MeshPhongMaterial({map: texCocpit});
		let meshCockpit = new THREE.Mesh(gCockpit, mCockpit);
		meshCockpit.castShadow = true;
		meshCockpit.name = "cockpit";
		meshCockpit.position.x = 0;
		meshCockpit.position.y = 0;
		meshCockpit.position.z = 0;
		helicopter.add(meshCockpit);
	});

	//Body:
	textureLoader.load( "images/metal1.jpg", function( texBody ) {
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
	} );

	//Rotor:
	textureLoader.load( "images/chocchip.png", function( texRotor ) {
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
	} );

    scene.add(helicopter);

    //Skygge?
    helicopter.castShadow = true;	//NB!
    //Flytter hele helikoptret:
    helicopter.position.y = 50;
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

function animate(currentTime) {
	requestAnimationFrame(animate);
	if (isTerrainHeightLoaded) {
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

		// Roterer helikoptrert i forhold til speedVector sin retning:
		helicopter.rotation.y = getRotationAngleUsingAtan2();

		//Sjekker input:
		keyCheck(elapsed);

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

function render()
{
     renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    if (isTerrainHeightLoaded)
    	render();
}

// Returnerer rotasjonsvinkel til speedVector.
// Ser man på XZ-planet (ovenfra) vil positiv rotasjon om Y-aksen gå mot klokka.
// Mat.antan2(x,z) - PI/2 gir rotasjonsvinkel til speedVector.
function getRotationAngleUsingAtan2()
{
	return Math.atan2(speedVector.x, speedVector.z) - Math.PI / 2;
};
