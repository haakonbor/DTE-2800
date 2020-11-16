// ********************************************************************** //
// SE BULLET DOCS: https://pybullet.org/Bullet/BulletFull/annotated.html *** //
//
// SE OGSÅ: https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
//      OG: https://github.com/kripken/ammo.js/
//      OG HER; http://lo-th.github.io/Ammo.lab/
//      OG: https://github.com/BlueMagnificent/baller
//   QUATERNIONS: https://medium.com/@joshmarinacci/quaternions-are-spooky-3a228444956d
//
//   TERRAIN DEMO: https://github.com/kripken/ammo.js/blob/master/examples/webgl_demo_terrain/index.html
//
// ********************************************************************** //

import * as THREE from "../../lib/three/build/three.module.js";
import { addCoordSystem} from "../../lib/wfa-coord.js";
import { getHeightData} from "../../lib/wfa-utils.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';

let physicsWorld, scene, camera, renderer, tmpTrans, rigidBodies = [];
let clock = new THREE.Clock();

let TERRAIN_SIZE = 400;
let terrainMesh;
let isTerrainHeightLoaded = false;
let ammoHeightData = null;
let terrainMaxHeight = undefined;   // Dennes settes basert på innleste høydedata (se createTerrainAmmoShape).
let terrainMinHeight = undefined;   // Dennes settes basert på innleste høydedata (se createTerrainAmmoShape).
let terrainWidthExtents = TERRAIN_SIZE*2;
let terrainDepthExtents = TERRAIN_SIZE*2;
let terrainWidth = 128;     // NB! Denne må matche størrelse på innlest høydedatafil.
let terrainDepth = 128;     // NB! Denne må matche størrelse på innlest høydedatafil (er i dette eksemplet 128x128 piksler).
let groundShape;
let controls;
let currentlyPressedKeys = [];
let terrainZrot=0;
let cubeRigidBody = null;

export function start(){
	tmpTrans = new Ammo.btTransform();

	setupPhysicsWorld();
	setupGraphics();
	createRandomBall();
	createRandomBall();
	createRandomBall();
	addTerrain();
	createCube();

	//Input - standard Javascript / WebGL:
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);
}

function setupPhysicsWorld(){
	let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),           // Angir bla.a. hvilke kollisjonsalgoritmer som skal brukes m.m.
		dispatcher          = new Ammo.btCollisionDispatcher(collisionConfiguration),   // Gir kollisjonsevents
		overlappingPairCache= new Ammo.btDbvtBroadphase(),                              // Indikerer hvilken type "grovsjekk" som skal brukes. Bruker default. AABBs, BoundingSphere. Inndeling av objekter, binary tree.
		solver              = new Ammo.btSequentialImpulseConstraintSolver();           // Indikerer hvordan objekter skal respondere på diverse begrensninger.

	physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -9.80665, 0));
}

//FRA: https://stackoverflow.com/questions/1484506/random-color-generator
function getRandomColor() {
	let letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
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

function setupGraphics(){
	//create the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xbfd1e5 );

	//Koordinatsystem:
	addCoordSystem(scene);

	//create camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 5000 );
	camera.position.set( 160, 300, 160 );
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	//Add directional light
	let dirLight1 = new THREE.DirectionalLight( 0xffffff , 1);
	dirLight1.color.setHSL( 0.1, 1, 0.95 );
	dirLight1.position.set( -0.1, 1.75, 0.1 );
	dirLight1.position.multiplyScalar( 100 );

	dirLight1.castShadow = true;
	let dLight = 500;
	let sLight = dLight;
	dirLight1.shadow.camera.left = - sLight;
	dirLight1.shadow.camera.right = sLight;
	dirLight1.shadow.camera.top = sLight;
	dirLight1.shadow.camera.bottom = - sLight;

	dirLight1.shadow.camera.near = dLight / 30;
	dirLight1.shadow.camera.far = dLight;

	dirLight1.shadow.mapSize.x = 1024 * 2;
	dirLight1.shadow.mapSize.y = 1024 * 2;

	scene.add( dirLight1 );

	//Setup the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0xbfd1e5 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true; //NB! For skygge.
	renderer.shadowMapSoft = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild( renderer.domElement );

	//Roter/zoom hele scenen:
	addControls();

	//Håndterer endring av vindusst�rrelse:
	window.addEventListener('resize', onWindowResize, false);

}

function createRandomBall() {
	let xPos = Math.random() * TERRAIN_SIZE - (TERRAIN_SIZE/2);
	let yPos = 120 + Math.random() * 500;
	let zPos = Math.random() * TERRAIN_SIZE - (TERRAIN_SIZE/2);

	let radius = Math.random() * 20;
	let mass = Math.random() * 5 * radius;
	let color = getRandomColor();
	createBall(radius, mass, color, {x:xPos,y:yPos,z:zPos});
}

function createBall(radius, mass, color, pos){
	if (!radius) radius = 1;
	if (!mass) mass = 1;
	if (!color) color = getRandomColor();
	if (!pos) pos={x:0,y:50,z:0};

	let quat = {x: 0, y: 0, z: 0, w: 1};
	//Three
	let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: color}));
	ball.position.set(pos.x, pos.y, pos.z);
	ball.castShadow = true;
	ball.receiveShadow = true;
	scene.add(ball);

	//Ammojs
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btSphereShape( radius );
	colShape.setMargin( 0.05   );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );
	body.setRestitution(0.8);
	body.setFriction(0.4);

	physicsWorld.addRigidBody( body );
	// physicsWorld.addRigidBody( body, colGroupRedBall, colGroupTerrain );

	ball.userData.physicsBody = body;
	ball.userData.name = 'ball';
	rigidBodies.push(ball);
}

function createCube(){
	let pos = {x: 40, y: 140, z: -20};
	let scale = {x: 15, y: 15, z: 15};
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 60;

	//Three
	let cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0x10Ef64}));
	cubeMesh.position.set(pos.x, pos.y, pos.z);
	cubeMesh.scale.set(scale.x, scale.y, scale.z);
	cubeMesh.castShadow = true;
	cubeMesh.receiveShadow = true;
	scene.add(cubeMesh);

	//Ammojs
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
	colShape.setMargin( 0.05 );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	cubeRigidBody = new Ammo.btRigidBody( rbInfo );
	cubeRigidBody.setRestitution(0.8);
	cubeRigidBody.setFriction(0.4);
	physicsWorld.addRigidBody( cubeRigidBody );

	cubeMesh.userData.physicsBody = cubeRigidBody;
	cubeMesh.userData.name = 'cube';
	rigidBodies.push(cubeMesh);
}

// Legger til terreng:
function addTerrain() {
	getHeightData('textures/heightmap3.png', 128, 128, terrainHeightLoaded);
}

//Denne kjores naar hoydedata er ferdiga lastet og generert:
function terrainHeightLoaded(heightData) {
	let textureLoader = new THREE.TextureLoader();
	textureLoader.load( "./textures/tile2.png", function( texture ) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( terrainWidth - 1, terrainDepth - 1 );

		// Ammo: Lager og returnerer en btHeightfieldTerrainShape:
		groundShape = createTerrainAmmoShape(heightData, terrainWidth, terrainDepth);
		let groundTransform = new Ammo.btTransform();
		groundTransform.setIdentity();
		groundTransform.setOrigin( new Ammo.btVector3( 0, 0, 0 ) );
		let groundMass = 0;
		let groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
		groundShape.calculateLocalInertia( groundMass, groundLocalInertia );
		let groundMotionState = new Ammo.btDefaultMotionState( groundTransform );

		let rbInfo = new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia );
		let groundBody = new Ammo.btRigidBody(rbInfo);
		groundBody.setRestitution(0.5); //Sprett!
		groundBody.setFriction(0.3);
		physicsWorld.addRigidBody( groundBody );

		// Three:
		// scaleX / scaleY henger sammen med heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );
		// i createTerrainAmmoShape()
		let scaleX = terrainWidthExtents / ( terrainWidth - 1 );    //2 * 400 / (128-1) = 6
		let scaleZ = terrainDepthExtents / ( terrainDepth - 1 );    //2 * 400 / (128-1) = 6
		// Størrelse på PlaneBufferGeometry: with = height = 128 * 6 = 768
		// Denne inndeles så i 127 * 127 småruter.
		let terrainGeometry = new THREE.PlaneBufferGeometry( terrainWidth*scaleX, terrainDepth*scaleZ, terrainWidth - 1, terrainDepth - 1 );
		terrainGeometry.rotateX( - Math.PI / 2 );
		let vertices = terrainGeometry.attributes.position.array;
		// Ammo-shapen blir (automatisk) sentrert om origo basert på terrainMinHeight og terrainMaxHeight.
		// Må derfor korrigere THREE-planets y-verdier i forhold til dette.
		// Flytter dermed three-planet NED, tilsvarende minHeigt + (maxHeight - minHeight)/2.
		let delta = (terrainMinHeight + ((terrainMaxHeight-terrainMinHeight)/2));
		for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
			// j + 1 because it is the y component that we modify
			vertices[ j + 1 ] = heightData[ i ] - delta;
		}
		// Oppdater normaler:
		terrainGeometry.computeVertexNormals();

		let groundMaterial = new THREE.MeshPhongMaterial( { color: 0xC7C7C7, side: THREE.DoubleSide } );
		groundMaterial.map = texture;
		groundMaterial.needsUpdate = true;

		terrainMesh = new THREE.Mesh( terrainGeometry, groundMaterial );
		terrainMesh.userData.physicsBody = groundBody;
		rigidBodies.push(terrainMesh);

		terrainMesh.receiveShadow = true;
		scene.add( terrainMesh );

		isTerrainHeightLoaded = true;

		animate();
	} );
}

// FRA: http://kripken.github.io/ammo.js/examples/webgl_demo_terrain/index.html
// Lager en Ammo.btHeightfieldTerrainShape vha. minnebufret ammoHeightData.
// ammoHeightData FYLLES vha. heightData OG terrainWidth, terrainDepth - parametrene.
// Gjøres vha. brukes Ammo._malloc og Ammo.HEAPF32[].
function createTerrainAmmoShape(heightData, terrainWidth, terrainDepth) {

	// This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
	let heightScale = 1;

	// Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
	let upAxis = 1;

	// hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
	let hdt = "PHY_FLOAT";

	// Set this to your needs (inverts the triangles)
	let flipQuadEdges = false;

	// Creates height data buffer in Ammo heap
	ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );

	// NB! Viktig å finne og sette terrainMaxHeight og terrainMinHeight:
	let p = 0;
	let p2 = 0;
	terrainMaxHeight = -100000;     //NB! setter til en lav (nok) verdi for å være sikker.
	terrainMinHeight = 100000;      //NB! setter til en høy (nok) verdi for å være sikker.
	// Copy the javascript height data array to the Ammo one.
	for ( let j = 0; j < terrainDepth; j ++ ) {
		for ( let i = 0; i < terrainWidth; i ++ ) {
			if (heightData[p] < terrainMinHeight)
				terrainMinHeight = heightData[p];
			if (heightData[p] >= terrainMaxHeight)
				terrainMaxHeight = heightData[p];
			// write 32-bit float data to memory  (Se: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift)
			Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightData[ p ];   // >>  Signed right shift. Shifts right by pushing copies of the leftmost bit in from the left, and let the rightmost bits fall off.
			p ++;
			// 4 bytes/float
			p2 += 4;
		}
	}
	// Creates the heightfield physics shape
	let heightFieldShape = new Ammo.btHeightfieldTerrainShape(
		terrainWidth,
		terrainDepth,
		ammoHeightData,
		heightScale,
		terrainMinHeight,
		terrainMaxHeight,
		upAxis,
		hdt,
		flipQuadEdges
	);

	// Set horizontal scale
	let scaleX = terrainWidthExtents / ( terrainWidth - 1 );
	let scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
	heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );
	heightFieldShape.setMargin( 0.0 );
	return heightFieldShape;
}

function updatePhysics( deltaTime ){
	if (!tmpTrans)
		return;

	// Step world
	physicsWorld.stepSimulation( deltaTime, 10 );

	// Update rigid bodies
	for ( let i = 0; i < rigidBodies.length; i++ ) {
		let objThree = rigidBodies[ i ];
		let objAmmo = objThree.userData.physicsBody;
		let ms = objAmmo.getMotionState();
		if ( ms ) {

			ms.getWorldTransform( tmpTrans );
			let p = tmpTrans.getOrigin();
			let q = tmpTrans.getRotation();
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
		}
	}
}

function render()
{
	renderer.render(scene, camera);
}

function animate(){
	requestAnimationFrame( animate );

	let deltaTime = clock.getDelta();
	updatePhysics( deltaTime );

	//Sjekker input:
	keyCheck(deltaTime);

	if (terrainMesh)
		terrainMesh.rotation.z = terrainZrot;

	//Tegner scenen med gitt kamera:
	render();

	//Oppdater trackball-kontrollen:
	if (controls)
		controls.update();
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

	controls.handleResize();
	animate();
}

//Sjekker tastaturet:
function keyCheck(elapsed) {
	if (currentlyPressedKeys[32]) { //A
		createRandomBall();
	}

	//NB! Denne er viktig. rb deaktiveres når den blir stående i ro.
	cubeRigidBody.activate(true);
	if (currentlyPressedKeys[83]) {	//S
		cubeRigidBody.applyCentralImpulse( new Ammo.btVector3(0, 520, 0 ));
	}

	if (currentlyPressedKeys[87]) {	//W
		cubeRigidBody.applyCentralImpulse( new Ammo.btVector3(-50, 420, -50 ));
	}

	if (currentlyPressedKeys[72]) {	//H
		createRandomBall();
	}
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}
