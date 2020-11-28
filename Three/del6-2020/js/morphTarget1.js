/**
 * Morphing  av objekter.
 *
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";
import * as dat from "../../lib/datgui/build/dat.gui.module.js";
// import {TWEEN} from '../../lib/three/examples/jsm/libs/tween.min.js';

// SE EKSEMPEL HER: https://threejs.org/examples/webgl_morphtargets.html

//Globale varianbler:
let renderer;
let scene;
let camera;
let mesh;
//Roter & zoom:
let controls; //rotere, zoone hele scenen.

//Tar vare p� tastetrykk:
let currentlyPressedKeys = {};

//Klokke:
let clock = new THREE.Clock();

//Lager en dat-gui meny:
let datGuiMenuElements = function () {
    // set to 0.01 to make sure dat.gui shows correct output
    this.influence1 = 0.01;
    this.influence2 = 0.01;
    // Funksjonen som kjører når man endrer på datGUIparams.influence1 eller datGUIparams.influence2
    this.update = function (value) {
	    mesh.morphTargetInfluences[ 0 ] = datGUIparams.influence1;  // Mesh.morphTargetInfluences er et array med vektverdier (0 - 1)
	    mesh.morphTargetInfluences[ 1 ] = datGUIparams.influence2;
    };
};

let datGUIparams = new datGuiMenuElements();

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

	let gui = new dat.GUI();
	gui.add(datGUIparams, 'influence1', 0, 1).onChange(datGUIparams.update);
	gui.add(datGUIparams, 'influence2', 0, 1).onChange(datGUIparams.update);

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
	spotLight.shadowCameraVisible = false;		//NB!! Viser lyskildens posisjon og utstrekning.
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
	//addCoordSystem(scene);

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

function showTarget(geometry, posX, posY, posZ) {
	let material = new THREE.MeshPhongMaterial({color: 0xb846db, transparent: true, opacity: 0.5});
	let mesh1 = new THREE.Mesh( geometry, material );
	mesh1.position.set(posX, posY, posZ);
	scene.add( mesh1 );
}

// Geometry.morphTargets: Array of morph targets. Each morph target is a Javascript object:
function addModels() {

	// Utgangskube:
    let material = new THREE.MeshLambertMaterial({ morphTargets: true, color: 0x00AE22 });
	let geometry = new THREE.BoxGeometry(40, 40, 40);

	//Morph target 1 geometri:
	let geometryTarget1 = new THREE.BoxGeometry(20, 90, 20);
	showTarget(geometryTarget1, -180, 0, 0);

	//Morph target 2 geometri:
	let geometryTarget2 = new THREE.BoxGeometry(120, 20, 120);
	showTarget(geometryTarget2, 180, 0, 0);

	// Target 1: Sørger for at utgangsgeometrien, geometry, får et objekt som inneholder target1 sine vertekser:
	let vertices = [];
	for ( let v = 0; v < geometryTarget1.vertices.length; v ++ ) {
		vertices.push( geometryTarget1.vertices[ v ].clone() );
	}
	geometry.morphTargets.push( { name: "target1", vertices: vertices } ); //geometry.morphTargets[0]

	// Target 2:  Sørger for at utgangsgeometrien, geometry, får et objekt som inneholder target2 sine vertekser:
	vertices = [];
	for ( let v = 0; v < geometryTarget2.vertices.length; v ++ ) {
		vertices.push( geometryTarget2.vertices[ v ].clone() );
	}
	geometry.morphTargets.push( { name: "target2", vertices: vertices } );   //geometry.morphTargets[1]

	geometry = new THREE.BufferGeometry().fromGeometry( geometry );
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );
}

//Legger til roter/zoom av scenen:
function addControls() {
    //NB! Viktit med renderer.domElement her pga. dat-gui (hvis ikke henger kontrollen fast i musepekeren).
    controls = new TrackballControls(camera, renderer.domElement);
	controls.addEventListener( 'change', render);
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 10;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
}

//function animate(currentTime) {
function animate() {
	requestAnimationFrame(animate);

	let elapsed = clock.getDelta(); 	// Forl�pt tid siden siste kall p� draw().

	//Sjekker input:
	keyCheck(elapsed);

	//Oppdater trackball-kontrollen:
	controls.update();

	//Tegner scenen med gitt kamera:
	render();
}

//Sjekker tastaturet:
function keyCheck(elapsed) {

	if (currentlyPressedKeys[65]) { //A

    }
    if (currentlyPressedKeys[83]) {	//S

    }
    if (currentlyPressedKeys[87]) {	//W

    }
    if (currentlyPressedKeys[68]) {	//D

    }

    //H�yde (V/B):
    if (currentlyPressedKeys[86]) { //V

    }
    if (currentlyPressedKeys[66]) {	//B

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
