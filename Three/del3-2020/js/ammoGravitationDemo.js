/********************************************************************** /
 Demonstrerer falltid på et objekt fra 100 meter påvirket av gravitasjonen.
 Fasit: https://www.omnicalculator.com/physics/free-fall

 Annet:
 BULLET DOCS: https://pybullet.org/Bullet/BulletFull/annotated.html
 OG: https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
 OG: https://github.com/kripken/ammo.js/
 OG HER; http://lo-th.github.io/Ammo.lab/
 OG: https://github.com/BlueMagnificent/baller
 **********************************************************************/

import * as THREE from "../../lib/three/build/three.module.js";
import { addCoordSystem} from "../../lib/wfa-coord.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import Stats from '../../lib/three/examples/jsm/libs/stats.module.js';

//variable declaration
let physicsWorld, scene, camera, renderer, tmpTrans, rigidBodies = [];
let clock = new THREE.Clock();

let TERRAIN_SIZE = 20;
let terrainMesh;
let terrainWidth = 128;
let terrainDepth = 128;
let controls;
let currentlyPressedKeys = [];
let terrainZrot=0;
let terrainRigidBody = null;
let sphereRigidBody = null;

let sphereHitGround = false;
let startTime = 0;
let stopTime = 0;

let ammoConcreteContactResultCallback;
let stats;

export function start(){
	tmpTrans = new Ammo.btTransform();

	//Input - standard Javascript / WebGL:
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	// Stats:
	stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );

	setupPhysicsWorld();
	setupGraphics();

	let xPos = 0;
	let yPos = 100;
	let zPos = 0;
	let radius = 1;
	let mass = 1;
	let color = getRandomColor();
	createBall(radius, mass, color, xPos, yPos, zPos);
	createTerrain();
}

function setupPhysicsWorld(){

	let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
		dispatcher          = new Ammo.btCollisionDispatcher(collisionConfiguration),
		overlappingPairCache= new Ammo.btDbvtBroadphase(),
		solver              = new Ammo.btSequentialImpulseConstraintSolver();

	physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -9.80665, 0));

	ammoConcreteContactResultCallback = new Ammo.ConcreteContactResultCallback();
	ammoConcreteContactResultCallback.addSingleResult = function( manifoldPoint, collisionObjectA, id0, index0, collisionObjectB, id1, index1 ) {
		/*
		* persistent manifolds are the objects that store information between pairs of objects that pass the broad phase
		* */

		if (!sphereHitGround) {
			stopTime = clock.getElapsedTime();
			sphereHitGround = true;
			console.log("Falltid: " + String(stopTime - startTime));
			// Debug:
			/*
			let bodyA = Ammo.wrapPointer(collisionObjectA, Ammo.btCollisionObject);
			let uBodyA = Ammo.btRigidBody.prototype.upcast(bodyA);
			let body = Ammo.castObject(bodyA, Ammo.btRigidBody);
			console.log(uBodyA);
			console.log(body);
			*/
		}
	}
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
	camera.position.set( 70, 180, 70 );
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

function createBall(radius, mass, color, xi, yi, zi){

	let pos = {x: xi, y: yi, z: zi};
	let quat = {x: 0, y: 0, z: 0, w: 1};

	//ThreeJS:
	let ballMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: color}));
	ballMesh.position.set(pos.x, pos.y, pos.z);
	ballMesh.castShadow = true;
	ballMesh.receiveShadow = true;
	scene.add(ballMesh);

	//AmmoJS:
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );

	// MOTION STATE-objektet:
	let motionState = new Ammo.btDefaultMotionState( transform );

	// COLLISION SHAPE-objektet:
	let sphereShape = new Ammo.btSphereShape( radius );
	sphereShape.setMargin( 0.05 );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );   //treghetsmoment
	sphereShape.calculateLocalInertia( mass, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, sphereShape, localInertia );

	// RIGID BODY-objektet:
	sphereRigidBody = new Ammo.btRigidBody( rbInfo );
	sphereRigidBody.setRestitution(0.6);
	sphereRigidBody.setFriction(0);

	physicsWorld.addRigidBody( sphereRigidBody );

	// Knytter fysikkobjektet til Three-objektet/kula:
	ballMesh.userData.physicsBody = sphereRigidBody;
	ballMesh.userData.name = 'ballMesh';

	rigidBodies.push(ballMesh);
}

// Legger til terreng:
function createTerrain(){
	// ThreeJS:
	let terrainGeometry = new THREE.PlaneBufferGeometry( TERRAIN_SIZE * 2, TERRAIN_SIZE * 2, terrainWidth - 1, terrainDepth - 1 );
	terrainGeometry.rotateX( - Math.PI / 2 );
	let groundMaterial = new THREE.MeshPhongMaterial( { color: 0xC709C7, side: THREE.DoubleSide } );
	terrainMesh = new THREE.Mesh( terrainGeometry, groundMaterial );
	terrainMesh.receiveShadow = true;
	scene.add( terrainMesh );

	let textureLoader = new THREE.TextureLoader();
	textureLoader.load( "./images/tile2.png", function( texture ) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( terrainWidth - 1, terrainDepth - 1 );
		groundMaterial.map = texture;
		groundMaterial.needsUpdate = true;

		// AmmoJS:
		let pos = {x: 0, y: 0, z: 0};
		let scale = {x: TERRAIN_SIZE * 2, y: 0 , z:TERRAIN_SIZE * 2};
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 0;   // <=== NB! Massen = 0, betyr at objektet står i ro.

		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );

		// MOTION STATE-objektet:
		let motionState = new Ammo.btDefaultMotionState( transform );

		// COLLISION SHAPE-objektet:
		let terrainShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
		terrainShape.setMargin( 0.05 );
		let localInertia = new Ammo.btVector3( 0, 0, 0 );
		terrainShape.calculateLocalInertia( mass, localInertia );
		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, terrainShape, localInertia );

		// RIGID BODY-objektet:
		terrainRigidBody = new Ammo.btRigidBody( rbInfo );
		terrainRigidBody.setRestitution(0.8);
		terrainRigidBody.setFriction(0.4);
		physicsWorld.addRigidBody( terrainRigidBody );

		// Knytter fysikkobjektet til Three-objektet/terrenget:
		terrainMesh.userData.physicsBody = terrainRigidBody;
		terrainMesh.userData.name = 'terrain';
		rigidBodies.push(terrainMesh);

		// Start timer:
		startTime = clock.getElapsedTime();
		console.log("startTime: " + String(startTime));

		animate();
	} );
}

function render()
{
	renderer.render(scene, camera);
}

function updatePhysics( deltaTime ){

	if (!tmpTrans)
		return;

	// Kollisjonsdeteksjon:
	if (terrainRigidBody)
		physicsWorld.contactPairTest(terrainRigidBody, sphereRigidBody, ammoConcreteContactResultCallback);
		//physicsWorld.contactTest(terrainRigidBody, ammoConcreteContactResultCallback);

	// stepSimulation
	physicsWorld.stepSimulation( deltaTime, 10 );

	// Sett transformasjon på three-objektene vha. MotionState til rigid bodies:
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

function animate(){

	stats.begin();
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

	stats.end();

	requestAnimationFrame( animate );

}

//*** GENERELT OPPSETT, ENDRGIN AV VINDUSTØRRELSE, INPUT O.L ***//
function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
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

}
