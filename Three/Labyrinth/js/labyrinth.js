/*
	Labyrintspill

	Kode basert på "tiltableTerrain.js" av Werner Farstad. Endret koden slik at terrenget nå er et labyrintspill.
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";
import { setupPhysicsWorld,
	updatePhysics,
	createTiltableTerrain,
	createRandomBall,
	tiltGameBoard
} from "./tiltableTerrainHelpers.js";

//Globale variabler
let scene, camera, renderer;
let clock = new THREE.Clock();
let controls;
let currentlyPressedKeys = [];

// Max rotering
let maxRotation = 15;
let currentXRotation = 0;
let currentZRotation = 0;

let ballInPlay = false;

export function start(){
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);
	setupPhysicsWorld();
	setupGraphics();
	createTiltableTerrain(scene);
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

function keyCheck(elapsed) {
	if (currentlyPressedKeys[72] && !ballInPlay) {	//H
		createRandomBall(scene)
		ballInPlay = true;
	}
	// Rotasjon om Z:
	if (currentlyPressedKeys[65] && currentZRotation < maxRotation) {	//A
		currentZRotation += 0.05;
		tiltGameBoard(3, 0.05);
	}
	if (currentlyPressedKeys[68] && currentZRotation > -maxRotation) {	//D
		currentZRotation -= 0.05
		tiltGameBoard(3, -0.05);
	}
	// Rotasjon om X:
	if (currentlyPressedKeys[87] && currentXRotation > -maxRotation) {	//W
		currentXRotation -= 0.05;
		tiltGameBoard(1, -0.05);
	}
	if (currentlyPressedKeys[83] && currentXRotation < maxRotation) {	//S
		currentXRotation += 0.05;
		tiltGameBoard(1, 0.05);
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
	requestAnimationFrame( animate );
	let deltaTime = clock.getDelta();
	updatePhysics( deltaTime );
	//Sjekker input:
	keyCheck(deltaTime);
	//Tegner scenen med gitt kamera:
	render();
	//Oppdater trackball-kontrollen:
	if (controls)
		controls.update();
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
