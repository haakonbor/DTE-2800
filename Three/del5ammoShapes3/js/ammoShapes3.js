/*
	::: Just add your clearForces() and velocities to it to stop the body from moving on from the new position
 */

import * as THREE from "../../lib/three/build/three.module.js";
import Stats from '../../lib/three/examples/jsm/libs/stats.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";
import { setupPhysicsWorld,
	updatePhysics,
	createTerrain,
	createMoveableShape,
	createRandomBall,
	moveStaticKinematicObject,
	createTriangleMeshShape,
	createCupObject,
	createHeliObject
} from "./ammoShapeHelpers3.js";

//Globale variabler
let scene, camera, renderer;
let clock = new THREE.Clock();
let controls;
let currentlyPressedKeys = [];
let stats;

export function start(){

	//Input - standard Javascript / WebGL:
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );

	setupPhysicsWorld();
	setupGraphics();

	createTerrain(scene);
	createMoveableShape(scene);

	// Vilkårlig shape - bruk av btBvhTriangleMeshShape:
	// Sylinder1:
	let geometry = new THREE.CylinderBufferGeometry(8,8, 10, 32, 32);    // NB! Bruker BufferGeometry
	let cylinderMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true}));
	cylinderMesh.position.set(-20,30, -20);
	cylinderMesh.scale.set(0.3,0.3,0.3);
	createTriangleMeshShape(scene, cylinderMesh, 40);

	// Sylinder2:
	let geometry1 = new THREE.CylinderBufferGeometry(8,8, 10, 32, 32);    // NB! Bruker BufferGeometry
	let cylinderMesh1 = new THREE.Mesh(geometry1, new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true}));
	cylinderMesh1.position.set(24,40, 16);
	cylinderMesh1.scale.set(0.6,0.6,0.6);
	createTriangleMeshShape(scene, cylinderMesh1, 12);

	// Vilkårlig og sammensatt mesh, kaffekoppen:
	createCupObject(scene);
	createHeliObject(scene);
	animate();
}

function setupGraphics(){

	//create the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	//create camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 5000 );
	camera.position.set( 15, 30, 50 );
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

	let dirLight2= new THREE.DirectionalLight( 0xffffff , 1);
	dirLight2.position.set( 0.1, 0.1, 10 );
	dirLight2.castShadow = true;
	scene.add( dirLight2 );

	//Setup the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0xbfd1e5 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.shadowMap.enabled = true;

	//Koordinatsystem:
	addCoordSystem(scene);

	addControls();

	window.addEventListener('resize', onWindowResize, false);
}

// Fanger opp tastetrykk (WS = Left stick, AD = Right Stick):
function keyCheck(elapsed) {
	if (currentlyPressedKeys[72]) {	//H
		createRandomBall(scene);
	}

	if (currentlyPressedKeys[65]) {	//A
		moveStaticKinematicObject( {x:-0.2, y:0, z:0});
	}
	if (currentlyPressedKeys[68]) {	//D
		moveStaticKinematicObject( {x:0.2, y:0, z:0});
	}

	if (currentlyPressedKeys[87]) {	//W
		moveStaticKinematicObject( {x:0, y:0, z:-0.2});
	}
	if (currentlyPressedKeys[83]) {	//S
		moveStaticKinematicObject( {x:0, y:0, z:0.2});
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls.handleResize();
	animate();
}

function animate(){
	stats.begin();
	let deltaTime = clock.getDelta();
	updatePhysics( deltaTime );
	//Sjekker input:
	keyCheck(deltaTime);
	//Tegner scenen med gitt kamera:
	render();
	//Oppdater trackball-kontrollen:
	if (controls)
		controls.update();
	stats.end();
	requestAnimationFrame( animate );
}

function render()
{
	renderer.render(scene, camera);
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	//console.log(event);
	currentlyPressedKeys[event.keyCode] = true;
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
