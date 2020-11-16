/**
 * Legger til diverse sprites.
 *
 * Bruker standard javascript / WebGL-inputhåndtering (keyboard)
 * wasd + pil opp / ned (fart)
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

let SIZE = 200;

let helicopter;	                        	//Helikoptermodellen.
let heliSpeed = 10;							//Helokoptrets hastighet.
let speedVector = new THREE.Vector3(-3,0,-1);		//Fartsvektor.
let positionVector = new THREE.Vector3(-3,0,-1); 	//Posisjonsvetor.
let delta = Math.PI/100;  						//Hvor mye fartsvektoren roterer
let axis = new THREE.Vector3( 0, 1, 0 );		//Hvilken akse fartsvektoren roterer rundt.

//Tar vare p� tastetrykk:
let currentlyPressedKeys = {};

//Figurer som helikoptret kan kr�sje i:
let collidableMeshList = [];

import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem } from "../../lib/wfa-coord.js";

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	//Lager en scene:
	scene = new THREE.Scene();

	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true; //NB!
	renderer.shadowMapType = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;

	//Oppretter et kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.x = 130;
	camera.position.y = 200;
	camera.position.z = 150;
	camera.up = new THREE.Vector3(0, 1, 0);
    let target = new THREE.Vector3(0.0, 0.0, 0.0);
    camera.lookAt(target);

    //Lys:
	let spotLight = new THREE.SpotLight(0xffffff); //hvitt lys
	spotLight.position.set( 0, 400, 0 );
	spotLight.castShadow = true;
	spotLight.shadowMapWidth = 1024;
	spotLight.shadowMapHeight = 1024;
	spotLight.shadowCameraNear = 200;
	spotLight.shadowCameraFar = 410;
	//spotLight.shadowCameraVisible = true;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);

	//Retningsorientert lys:
	let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight1.position.set(2, 1, 4);
	scene.add(directionalLight1);

	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight2.position.set(-2, 1, -4);
	scene.add(directionalLight2);

	//Legg modeller til scenen:
	addModels();

	//Koordinatsystem:
	addCoordSystem(scene);

    //Skilt (sprite)
    let wTexture = new THREE.ImageUtils.loadTexture("images/warninglight.png");
    let posX=40, posY=10, posZ=-60;
    let warningSign = createWarningSprite(10, 1, 0xffffff, 1, wTexture, posX, posY, posZ);
    scene.add(warningSign);
    //Tre (sprite)
    let tTexture = new THREE.ImageUtils.loadTexture("images/tree.png");
    posX=40, posY=10, posZ=60;
    let tree = createTreeSprite(20, 0.5, 0xffffff, tTexture, posX, posY, posZ);
    scene.add(tree);

	//Roter/zoom hele scenen:
	addControls();

    //H�ndterer endring av vindusst�rrelse:
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

function createWarningSprite(_size, _opacity, _color, _spriteNumber, _texture, _posX, _posY, _posZ) {
	let spriteMaterial = new THREE.SpriteMaterial({
		opacity: _opacity,
		color: _color,
		blending: THREE.NormalBlending,
		uvOffset: new THREE.Vector2(0, 0.5 * _spriteNumber),
		uvScale: new THREE.Vector2(1, 0.5),
		map: _texture
	});

	let sprite = new THREE.Sprite(spriteMaterial);
	sprite.scale.set(_size,_size,_size);
	sprite.position.set(_posX, _posY, _posZ);
	sprite.updateMatrix();
	return sprite;
}

function createTreeSprite(_size, _opacity, _color, _texture, _posX, _posY, _posZ) {
	let spriteMaterial = new THREE.SpriteMaterial({
		opacity: _opacity,
		color: _color,
		blending: THREE.NormalBlending,
		depthTest: true,
		map: _texture
	});

	let sprite = new THREE.Sprite(spriteMaterial);
	sprite.scale.set(_size,_size,_size);
	sprite.position.set(_posX, _posY, _posZ);
	//sprite.updateMatrix();
	return sprite;
}

function addModels() {
	//Plan:
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2 );
	let mPlane = new THREE.MeshLambertMaterial( {color: 0x91aff11, side: THREE.DoubleSide } );
	let meshPlane = new THREE.Mesh( gPlane, mPlane);
	meshPlane.rotation.x = Math.PI / 2;
	meshPlane.receiveShadow = true;	//NB!
	scene.add(meshPlane);
	//collidableMeshList.push(meshPlane);

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
	cube.position.y = 20;
	cube.position.z = -100;
	cube.castShadow = true;
	scene.add(cube);
	collidableMeshList.push(cube);

}

function addHeliModel() {
	//Konteiner:
	helicopter = new THREE.Object3D();

	//Cockpit:
	let texCocpit = THREE.ImageUtils.loadTexture('images/metal1.jpg');
	let gCockpit = new THREE.SphereGeometry(5, 8, 6);					//radius, widthSegments, heightSegments,
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
	let texRotor = THREE.ImageUtils.loadTexture('images/chocchip.png');
	let gRotor = new THREE.BoxGeometry(0.2, 20, 1);
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
    helicopter.position.y = 20;
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
	if (currentTime == undefined)
	    currentTime = 0; //Udefinert f�rste gang.

	let elapsed = 0.0; 			// Forl�pt tid siden siste kall p� draw().
	if (lastTime != 0.0) 		// F�rst gang er lastTime = 0.0.
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

	//Oppdater trackball-kontrollen:
	if (controls != undefined)
		controls.update();

	//Kollisjonsdeteksjon:
	collisionTest();

	//Tegner scenen med gitt kamera:
	render();
};

//Sjekker tastaturet:
function keyCheck(elapsed) {

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

    //H�yde (V/B):
    if (currentlyPressedKeys[86]) { //V
    	helicopter.position.y -= 0.3;
    }
    if (currentlyPressedKeys[66]) {	//B
    	helicopter.position.y += 0.3;
    }
}

//Fra: http://stackoverflow.com/questions/11473755/how-to-detect-collision-in-three-js
//Se referert lenke, koden er derfra:
function collisionTest() {
	/*
	let mCockpit = scene.getObjectByName("cockpit", true);  //Returnerer et Object3D-objekt
	collisionTestMesh(mCockpit);
	*/
	let mBody = scene.getObjectByName("body", true);
	collisionTestMesh(mBody);
	/*
	let mRotor = scene.getObjectByName("rotor", true);
	collisionTestMesh(mRotor);
	let mBRotor = scene.getObjectByName("bakrotor", true);
	collisionTestMesh(mBRotor);
	*/

}

//Kollisjonsvariabler:
let localVertex;
let globalVertex;
let directionVector;
let ray;
let collisionResults;

function collisionTestMesh(mesh) {
	//let originPoint = mesh.parent.position.clone();  //Returnerer helicopter-objektet (Object3D) f.eks. n�r mesh=cockpit.
	//Gjennoml�per alle vertekser til meshet:
	for (let vertexIndex = 0; vertexIndex < mesh.geometry.vertices.length; vertexIndex++)
	{
		//Modell/lokale koordinater for meshets vertekser:
		localVertex = mesh.geometry.vertices[vertexIndex].clone();
		//Transformerer modellkoordinat vha. meshets matrise:
		globalVertex = localVertex.applyMatrix4( mesh.matrix );
		//Lager en retningsvektpr, en RAY, fra meshets posisjon (globale koordinater) til transformert verteks:
		directionVector = globalVertex.sub( mesh.position );

		//Lager et Raycaster-objekt vha.
		ray = new THREE.Raycaster( positionVector /*originPoint*/, directionVector.clone().normalize() ); //fra, retning

		//Returnerer en liste med objekter som helikoptret kolliderer med (n�rmeste f�rst):
		collisionResults = ray.intersectObjects( collidableMeshList );

		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) {
			heliSpeed = 0;
			positionVector = new THREE.Vector3(-3,0,-1);
			//speedVector = new THREE.Vector3(0.3,0,0.1);
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

    if (controls != undefined)
    	controls.handleResize();
    render();
}

function getRotationAngleUsingAtan2()
{
	return Math.atan2(speedVector.x, speedVector.z) - Math.PI / 2;
};
