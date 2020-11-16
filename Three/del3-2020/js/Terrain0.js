/**
 * Terreng vha. heightmap (heightmap.png)
 */
//Globale variabler:
let renderer;
let scene;
let camera;
let controls; //rotere, zoone hele scenen.
// Terreng:
let TERRAIN_SIZE = 200;
let meshTerrain;
let isTerrainHeightLoaded = false;

import * as THREE from '../../lib/three/build/three.module.js';
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { getHeightData } from "../../lib/wfa-utils.js";

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');

	//Scene:
	scene = new THREE.Scene();

	//Lager et rendererobjekt (og setter størrelse):
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
	scene.add(spotLight);

	//Punktlys:
    let pointLight1 = new THREE.PointLight( 0xffffff, 1, 2000 );
    pointLight1.position.set( 0, 700, 0 );
    scene.add( pointLight1 );

	//Ambient:
	scene.add(new THREE.AmbientLight(0x221133));

	//Legg modeller til scenen:
	addTerrain();

	//Koordinatsystem:
	let axesHelper = new THREE.AxesHelper( TERRAIN_SIZE*2 );
	scene.add( axesHelper );

	//Roter/zoom hele scenen:
	addControls();

    //Håndterer endring av vindusstørrelse:
    window.addEventListener('resize', onWindowResize, false);

	animate();
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
	let planeNoTiles = 6-1; // Planet består av 5x5 ruter. Bruker høydedata fra en 6x6 .png
	/* FRA DOC:
		PlaneGeometry(width : Float, height : Float, widthSegments : Integer, heightSegments : Integer)
		width — Width along the X axis. Default is 1.
		height — Height along the Y axis. Default is 1.
		widthSegments — Optional. Default is 1.
		heightSegments — Optional. Default is 1.
	*/
	let planeGeometry = new THREE.PlaneGeometry( TERRAIN_SIZE, TERRAIN_SIZE, planeNoTiles, planeNoTiles );
	planeGeometry.computeVertexNormals();   // <== NB!
	// Alt 1: Enkelt materiale med farge og lys:
	/*
	let planeMaterial = new THREE.MeshLambertMaterial({ color: 0xff6611, side: THREE.DoubleSide, wireframe: false });
	meshTerrain = new THREE.Mesh( planeGeometry, planeMaterial);
	meshTerrain.translateY(-195.67);        // Basert på beregnet høydedata/z-verdi for gitt png.
	meshTerrain.rotation.x = -Math.PI / 2;
	scene.add(meshTerrain);
	//Laster fil med høydedata for planet (/lib/wfa-utils.js):
	getHeightData('images/simpleHeightmap3.png', 6, 6, terrainHeightLoaded);
	*/

	//Alt 2: Bruker teksturmateriale:
	// NB! Texture tiling er uavhengig av plan-rutenettet:
	let textureLoader = new THREE.TextureLoader();
	textureLoader.load( "images/tile2.png", function( textureMap ) {
		textureMap.wrapS = THREE.RepeatWrapping;
		textureMap.wrapT = THREE.RepeatWrapping;
		textureMap.repeat.x = 10;    // Økes dersom man ønsker texture tiling.
		textureMap.repeat.y = 10;
		let planeMaterial = new THREE.MeshLambertMaterial(
			{
				side: THREE.DoubleSide,
				map: textureMap,
				shading: THREE.SmoothShading,
				wireframe: false,
			});
		meshTerrain = new THREE.Mesh( planeGeometry, planeMaterial);
		//meshTerrain.translateY(-195.67);        // Basert på beregnet høydedata/z-verdi for gitt png.
		meshTerrain.rotation.x = -Math.PI / 2;
		scene.add(meshTerrain);

		//Laster fil med høydedata for planet (/lib/wfa-utils.js):
		getHeightData('images/simpleHeightmap3.png', 6, 6, terrainHeightLoaded);
	});
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
		controls.update();
		render();
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
