/**
 * Bruk av shader: Terreng & b�lger
 * 
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';

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

//Tar vare p� tastetrykk:
let currentlyPressedKeys = {};

//Terreng:
let meshTerrain;

let cube;
let step = 0;

export function main() {
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');
	
	//Scene:
	scene = new THREE.Scene();
	
	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true; //NB!
	renderer.shadowMapType = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;
	
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
	spotLight.position.set( 0, 3000, 0 ); 
	spotLight.castShadow = true; 
	spotLight.shadowMapWidth = 1024;   
	spotLight.shadowMapHeight = 1024; 
	spotLight.shadowCameraNear = 200; 
	spotLight.shadowCameraFar = 3500;
	spotLight.shadowCameraVisible = false;		//NB!! Viser lyskildens posisjon og utstrekning.
	scene.add(spotLight);
	
	//Ambient:
	scene.add(new THREE.AmbientLight(0x221133));
	
	//Legg modeller til scenen:
	addModels();
	
	//Koordinatsystem:
	//addCoordSystem();
	
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

function addModels() {
	//Plan:
	let planeNoTiles = 128-1; //heightmap.png har st�rrelse = 128 x 128 piksler.
	let gPlane = new THREE.PlaneGeometry( SIZE*2, SIZE*2, planeNoTiles, planeNoTiles );
	gPlane.computeVertexNormals();

    //Kube:
    //Geometri:
	let cubeGeometry = new THREE.BoxBufferGeometry(20, 20, 20);
    //Materiale: NB! ULIKE FRAGMENTSHADERE PER SIDE AV P� KUBEN.
	let meshMaterial1 = createMaterial("vertex-shader", "fragment-shader-1");
	let meshMaterial2 = createMaterial("vertex-shader", "fragment-shader-2");
	let meshMaterial3 = createMaterial("vertex-shader", "fragment-shader-3");
	let meshMaterial4 = createMaterial("vertex-shader", "fragment-shader-4");
	let meshMaterial5 = createMaterial("vertex-shader", "fragment-shader-5");
	let meshMaterial6 = createMaterial("vertex-shader", "fragment-shader-6");
    
	let material = new THREE.MeshFaceMaterial(
            [meshMaterial1,
                meshMaterial2,
                meshMaterial3,
                meshMaterial4,
                meshMaterial5,
                meshMaterial6]);
    
    //NB! Legge til attributter:
    //let attributes = {};
	//let attrVal = 101;
	//let noAttributes = 1;
	//cubeGeometry.addAttribute('mitt_attributt', new THREE.BufferAttribute(attrVal, noAttributes));

	cube = new THREE.Mesh(cubeGeometry, material);
	scene.add(cube);
}

//Lager et ShaderMaterial-objekt:
function createMaterial(vertexShader, fragmentShader) {
    let vertShader = document.getElementById(vertexShader).innerHTML;
    let fragShader = document.getElementById(fragmentShader).innerHTML;

    let uniforms = {
        time: { type: 'f', value: 0.2 },
        scale: { type: 'f', value: 0.2 },
        alpha: { type: 'f', value: 0.6 },
        resolution: { type: "v2", value: new THREE.Vector2() }
    };

    uniforms.resolution.value.x = window.innerWidth;
    uniforms.resolution.value.y = window.innerHeight;

    let meshMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        //attributes: attributes,  NB! SKAL N� LEGGE TIL BufferGeometry-objektet (se over).
        vertexShader: vertShader,
        fragmentShader: fragShader,
        transparent: true

    });
    return meshMaterial;
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
				  
		cube.rotation.y = step += 0.01;
		cube.rotation.x = step;
		cube.rotation.z = step;

		cube.material.forEach(function (e) {
		    e.uniforms.time.value += 0.01;
		    //e.uniforms.alpha.value = 0;
		});

		//Sjekker input:
		keyCheck(currentTime);
		
		//Oppdater trackball-kontrollen:
		controls.update();

		//Tegner scenen med gitt kamera:	
		render();
	
};

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
