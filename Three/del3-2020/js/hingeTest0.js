/*
	Demonstrerer bruk av Ammo hingeconstraint og applyCentralImpulse(vektor).
	Her lages en "hengsel" bestående av en kule og en avlang kube. Kula fungerer som forakring (masse=0) mens
	kuben er festet til kula vha. en hingeConstraint (se kode).

	Når man "dytter" på kuben skal den rotere rundt forankringspunktet.
	Metoden applyCentralImpulse(vektor) tar en vektor som argument. Vektoren bestemmer kraft og retning.

	Bruker man en vektor som står vinkelrett på kuben og bruker denne som argument til applyCentralImpulse() vil man
	dytte/skyve på rektanglet slik at det snurrer rundt.

	I koden under lages det i keyCheck() motoden to slike vektorer som peker i hver sin retning.
	Når bruker trykker V skyver man den ene veien.
	Når bruker trykker B skyver man den andre veien.

	Se også forklaring til keyCheck() metoden under.

	Legg også merke til:
	- Her brukes tre forskjellige THREE.ArrowHelper mesh for å illustrere aktuelle vektorer.
	- i keyCheck() brukes en blanding av Ammo og THREE-klasser til på hente og sette korrekte transformasjoner (rotasjoner).
	- Hengselobjektet kan posisjoneres fritt rundt på planet, vha pos. Se createHingeObject().
	- Planet kan rotere, MEN dersom hengselobjektets z-posisjon er noe annet enn 0 vil det ikke lenger ha korrekt høyde (må beregnes og settes).

 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";
import { setupPhysicsWorld,
	updatePhysics,
	createTerrain,
	createBox,
	createRandomBall,
	createBall,
	createHingeObject,
	moveBox,
	applyCentralImpulseOnStick
} from "./ammoHelpers1.js";

let scene, camera, renderer;
let clock = new THREE.Clock();
let controls;
let currentlyPressedKeys = [];
let arrowHelper1, arrowHelper2, arrowHelper3;

export function start(){

	//Input - standard Javascript / WebGL:
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	setupPhysicsWorld();
	setupGraphics();

	createTerrain(scene);
	createRandomBall(scene);
	createBall(scene);
	createBox(scene);
	createHingeObject(scene);
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

	//Setup the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0xbfd1e5 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.shadowMap.enabled = true;

	let dir = new THREE.Vector3( 1, 0, 0 );
	let origin = new THREE.Vector3( 0, 0, 0 );

	// PILER SOM ILLUSTRERER VEKTORENE:
	arrowHelper1 = new THREE.ArrowHelper( dir, origin);
	addArrow(55,  0x00FF00, arrowHelper1);

	arrowHelper2 = new THREE.ArrowHelper( dir, origin);
	addArrow(30, 0xff0000, arrowHelper2);

	arrowHelper3 = new THREE.ArrowHelper( dir, origin);
	addArrow(30,  0xF0FF00, arrowHelper3);

	//Koordinatsystem:
	addCoordSystem(scene);

	addControls();

	//Håndterer endring av vindusstørrelse:
	window.addEventListener('resize', onWindowResize, false);
}

function addArrow(length, hex, arrowHelper) {
	arrowHelper.setColor(new THREE.Color(hex));
	arrowHelper.setLength(length);
	scene.add( arrowHelper );
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

function keyCheck(elapsed) {
	// Flere kuler...
	if (currentlyPressedKeys[72]) {	//H
		createRandomBall(scene);
	}

	// Roterer "sticken":
	applyCentralImpulseOnStick(currentlyPressedKeys, arrowHelper1, arrowHelper2, arrowHelper3);

	// Styrer grønn kube:
	moveBox(currentlyPressedKeys);
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
