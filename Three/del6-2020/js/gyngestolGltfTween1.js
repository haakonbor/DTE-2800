/**
 * Basert på info fra: Learning Three.js: The Javascript 3D Librarry for WebGL.
 *
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";
import * as dat from "../../lib/datgui/build/dat.gui.module.js";
import { GLTFLoader } from '../../lib/three/examples/jsm/loaders/GLTFLoader.js';
import Stats from "../../lib/stats/build/stats.module.js";
import {TWEEN} from '../../lib/three/examples/jsm/libs/tween.module.min.js';
import {SkeletonUtils} from "../../lib/three/examples/jsm/utils/SkeletonUtils.js";

//Globale varianbler:
let renderer;
let scene;
let camera;

//Roter & zoom:
let controls; //rotere, zoone hele scenen.

//Tar vare p� tastetrykk:
let currentlyPressedKeys = {};

//FRA: https://github.com/mrdoob/stats.js/
let stats = new Stats();
let tween;
let clock;
let gltfModel;
let gyngestolMesh;

export function main() {
	//FPS...
	stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild( stats.domElement );

	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	//Tween, NB! ...onUpdate(doGyning):
	tween = new TWEEN.Tween({chair_rotation: -Math.PI/5})
		.to({chair_rotation: Math.PI/5}, 3000)
		.easing(TWEEN.Easing.Cubic.InOut)
		.yoyo(true)
		.repeat(Infinity)
		.onUpdate(doGynging);

	//Lager en scene:
	scene = new THREE.Scene();

	clock = new THREE.Clock();

	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({
		canvas : mycanvas,
		antialias : true
	});
	renderer.setClearColor(0xBFD104, 0xff);  		//farge, alphaverdi.
	//renderer.setClearColor(0x000000, 0xff); 		//farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true; //NB!
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;

	//Oppretter et kamera:
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.x = 30;
	camera.position.y = 70;
	camera.position.z = 80;
	camera.up = new THREE.Vector3(0, 1, 0);
	let target = new THREE.Vector3(0.0, 0.0, 0.0);
	camera.lookAt(target);

	//Lys:
	let spotLight = new THREE.SpotLight(0xffffff); //hvitt lys
	spotLight.position.set(0, 400, 0);
	spotLight.castShadow = true;
	spotLight.shadow.mapSize.Width = 1024;
	spotLight.shadow.mapSize.Height = 1024;
	spotLight.shadow.camera.near = 200;
	spotLight.shadow.camera.far = 410;
	//spotLight.shadowCameraVisible = true;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);

	//Retningsorientert lys:

	let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight1.position.set(100, 100, 100);
	scene.add(directionalLight1);

	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight2.position.set(-50, -10, -100);
	scene.add(directionalLight2);

	//Legg modeller til scenen:
	loadModel();

	//Koordinatsystem:
	addCoordSystem(scene);

	//Roter/zoom hele scenen:
	addControls();

	//H�ndterer endring av vindusst�rrelse:
	window.addEventListener('resize', onWindowResize, false);

	//Input - standard Javascript / WebGL:
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	animate();
}

//Brukes av tween:
function doGynging(object) {
    let chair_rotation = object.chair_rotation;   //object.chair_rotation refererer til objektet i: tween = new TWEEN.Tween({chair_rotation: -Math  . . .}) (se over).
	// Gyng..., roter om X-aksen:
	gyngestolMesh.rotation.set(chair_rotation, 0, 0);
};

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

//Kalles også fra redraw() i datgui-kontrollen:
function createMesh(geo, mat) {
	mesh = new THREE.Mesh( geo, mat);
	return mesh;
}

function loadModel() {
	const manager = new THREE.LoadingManager();
	manager.onLoad = start;  //Kjører init() under når modellene er ferdig lastet.

	// Bruker GLTFLoader for å laste .gltf / .glb filer.
	const gltfLoader = new GLTFLoader(manager);
	gltfLoader.load('./models/misc_chair01.glb', (gltf) => {
		gltfModel = gltf;
	});
}

function start() {

	const clonedScene = SkeletonUtils.clone(gltfModel.scene);
	gyngestolMesh = new THREE.Object3D();
	gyngestolMesh.add(clonedScene);
	gyngestolMesh.position.set(0, 0, 0);
	gyngestolMesh.scale.x = 15;
	gyngestolMesh.scale.y = 15;
	gyngestolMesh.scale.z = 15;
	scene.add(gyngestolMesh);

	// Start animasjon:
	tween.start();
}

// Legger til roter/zoom av scenen:
function addControls() {
	//NB! Viktit med renderer.domElement her pga. dat-gui (hvis ikke henger kontrollen fast i musepekeren).
	controls = new TrackballControls(camera, renderer.domElement);
	controls.addEventListener('change', render);
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 10;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
}

function animate(currentTime) {
	stats.begin();

	requestAnimationFrame(animate);

	let elapsed = clock.getDelta();

	//Oppdaterer tween:
	TWEEN.update(currentTime);

	//Sjekker input:
	keyCheck(elapsed);

	//Oppdater trackball-kontrollen:
	controls.update();

	//Tegner scenen med gitt kamera:
	render();

	stats.end();
};

//Sjekker tastaturet:
function keyCheck(elapsed) {

}

function render() {
	renderer.render(scene, camera);
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

	controls.handleResize();
	render();
}
