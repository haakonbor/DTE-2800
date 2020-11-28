/**
 * Demonstrerer skybox.
 *
 * SE: https://threejsfundamentals.org/threejs/lessons/threejs-backgrounds.html
 *
 * FLERE SKYBOXBILDER: https://opengameart.org/content/skiingpenguins-skybox-pack
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { addCoordSystem} from "../../lib/wfa-coord.js";
import {OrbitControls} from '../../lib/three/examples/jsm/controls/OrbitControls.js';

//Globale varianbler:
let renderer;
let scene;
let camera;
let SIZE = 1000;

//Tar vare p? tastetrykk:
let currentlyPressedKeys = {};
let clock = new THREE.Clock();
let skyBox;
let target = new THREE.Vector3(0, 0, 0);  //Camera target
let cubeMesh;
let controls;

export function main() {  
	//Henter referanse til canvaset:
	let mycanvas = document.getElementById('webgl');
	
	//Lager en scene:
	scene = new THREE.Scene();
	
	//Lager et rendererobjekt (og setter st�rrelse):
	renderer = new THREE.WebGLRenderer({canvas:mycanvas, antialias:true});
	renderer.autoClearColor = false;
	renderer.setClearColor(0xBFD104, 0xff);  //farge, alphaverdi.
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	renderer.shadowMap.enabled = true; //NB!
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; //THREE.BasicShadowMap;
	
    //Kamera:
	const fov = 75;
	const aspect = 2;  // the canvas default
	const near = 0.1;
	const far = 2000;
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.x = 20;
	camera.position.y = 30;
	camera.position.z = 12;
	scene.add(camera);

	//Retningsorientert lys:
	let directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight1.position.set(2, 1, 4);
	scene.add(directionalLight1);
	
	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); //farge, intensitet (1=default)
	directionalLight2.position.set(-2, 1, -4);
	scene.add(directionalLight2);

	const controls = new OrbitControls(camera, mycanvas);
	controls.target.set(0, 0, 0);
	controls.maxDistance = 1550;
	controls.minDistance = 20;
	controls.update();

    //Skybox:
	addSkybox();

	//Koordinatsystem:
	addCoordSystem(scene);

	//Legg modeller til scenen:
	addModels();
	
	//Koordinatsystem:
	let axes = new THREE.AxesHelper(500);
	scene.add(axes);
	
    //H�ndterer endring av vindusst�rrelse:
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keyup', handleKeyUp, false);
    document.addEventListener('keydown', handleKeyDown, false);

	animate();
}

function addSkybox() {
	let imagePrefix = "images/dawnmountain-";
	let directions = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
	let imageSuffix = ".png";

	let materialArray = [];
	for (let i = 0; i < 6; i++)
		materialArray.push(new THREE.MeshBasicMaterial({
			map:  new THREE.TextureLoader().load(imagePrefix + directions[i] + imageSuffix),
			side: THREE.BackSide
		}));
	// let skyMaterial = new THREE.MeshFaceMaterial(materialArray);
	for (let i = 0; i < 6; i++)
		materialArray[i].side = THREE.BackSide;

	let skyboxGeo = new THREE.BoxGeometry( SIZE, SIZE, SIZE);
	skyBox = new THREE.Mesh( skyboxGeo, materialArray );
	scene.add( skyBox );
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function addModels() {
    //Plan:
    let textureMap = new THREE.TextureLoader().load('images/chocchip.png');
    textureMap.wrapS = THREE.RepeatWrapping;
    textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.repeat.x = 10;
    textureMap.repeat.y = 10;

    let mPlane = new THREE.MeshLambertMaterial(
	{
	    color: 0xFFAC5, // 0x912ff11, 
	    side: THREE.DoubleSide,
	    map: textureMap,
	    flatShading: false,
	    wireframe: false,
	});
    let gPlane = new THREE.PlaneGeometry(SIZE, SIZE);

	let meshPlane = new THREE.Mesh( gPlane, mPlane);
	meshPlane.rotation.x = Math.PI / 2;
	meshPlane.position.set(0, 0, 0);
	scene.add(meshPlane);
	
	//Kube:
	let cubeSize = 20;
	let gCube = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
	let tCube =  new THREE.TextureLoader().load("images/bird1.png");
	let mCube = new THREE.MeshPhongMaterial({map : tCube});	
	cubeMesh = new THREE.Mesh(gCube, mCube);
	cubeMesh.name = "cubeMesh";
	cubeMesh.position.x = 0;
	cubeMesh.position.y = cubeSize/2;
	cubeMesh.position.z = 0;
	cubeMesh.castShadow = true;
	scene.add(cubeMesh);
}

function animate(currentTime) {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();
	render(delta);
};

function render(delta)
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
